import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function PATCH(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params

    const notification = await prisma.notification.update({
      where: { id },
      data: { isRead: true },
    })

    return NextResponse.json({ data: notification })
  } catch (error) {
    console.error('PATCH /api/notifications/[id]/read error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
