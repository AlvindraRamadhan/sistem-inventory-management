import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { notifType, type, title, message, href, targetRoles, targetUserId } = body

    if (!notifType || !type || !title || !message || !targetRoles) {
      return NextResponse.json(
        { error: 'Field notifType, type, title, message, targetRoles wajib diisi' },
        { status: 400 }
      )
    }

    const notification = await prisma.notification.create({
      data: {
        notifType,
        type,
        title,
        message,
        href: href ?? null,
        targetRoles,
        targetUserId: targetUserId ?? null,
      },
    })

    return NextResponse.json({ data: notification }, { status: 201 })
  } catch (error) {
    console.error('POST /api/notifications error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const role = searchParams.get('role')
    const userId = searchParams.get('userId')
    const isReadParam = searchParams.get('isRead')

    const where: Parameters<typeof prisma.notification.findMany>[0]['where'] = {
      OR: [
        ...(role ? [{ targetRoles: { has: role } }] : []),
        ...(userId ? [{ targetUserId: userId }] : []),
      ],
    }

    if (isReadParam !== null) {
      where.isRead = isReadParam === 'true'
    }

    const notifications = await prisma.notification.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: 50,
    })

    return NextResponse.json({ data: notifications })
  } catch (error) {
    console.error('GET /api/notifications error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
