import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '../../../lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { userId, userName, userRole, action, entityType, entityId, description, beforeData, afterData, ipAddress } = body

    if (!userId || !action || !entityType || !entityId || !description) {
      return NextResponse.json(
        { error: 'Field userId, action, entityType, entityId, description wajib diisi' },
        { status: 400 }
      )
    }

    const log = await prisma.auditLog.create({
      data: {
        userId,
        userName: userName ?? 'Unknown',
        userRole: userRole ?? 'apoteker',
        action,
        entityType,
        entityId,
        description,
        beforeData: beforeData ?? undefined,
        afterData: afterData ?? undefined,
        ipAddress: ipAddress ?? request.headers.get('x-forwarded-for') ?? undefined,
        timestamp: new Date(),
      },
    })

    return NextResponse.json({ data: log }, { status: 201 })
  } catch (error) {
    console.error('POST /api/audit-log error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const userId = searchParams.get('userId')
    const action = searchParams.get('action')
    const entityType = searchParams.get('entityType')
    const dateFrom = searchParams.get('dateFrom')
    const dateTo = searchParams.get('dateTo')
    const page = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10))
    const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') ?? '20', 10)))
    const skip = (page - 1) * limit

    const where: Parameters<typeof prisma.auditLog.findMany>[0]['where'] = {}
    if (userId) where.userId = userId
    if (action) where.action = action
    if (entityType) where.entityType = entityType
    if (dateFrom || dateTo) {
      where.timestamp = {}
      if (dateFrom) where.timestamp.gte = new Date(dateFrom)
      if (dateTo) where.timestamp.lte = new Date(dateTo)
    }

    const [data, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        skip,
        take: limit,
        orderBy: { timestamp: 'desc' },
        include: {
          user: { select: { name: true, role: true } },
        },
      }),
      prisma.auditLog.count({ where }),
    ])

    return NextResponse.json({
      data,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    })
  } catch (error) {
    console.error('GET /api/audit-log error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
