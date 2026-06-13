"use client"
import { useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"
import type { Notification } from "@prisma/client"

export function useRealtimeNotifications(userRole: string, userId: string) {
  const [notifications, setNotifications] = useState<Notification[]>([])

  useEffect(() => {
    if (!userRole || !userId) return

    fetch(`/api/notifications?role=${userRole}&userId=${userId}`)
      .then(r => r.json())
      .then(res => setNotifications(res.data ?? []))

    const supabase = createClient()
    const channel = supabase
      .channel('notifications')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'notification',
        filter: `target_user_id=eq.${userId}`,
      }, (payload) => {
        const notif = payload.new as Notification
        if (notif.targetRoles.includes(userRole) || notif.targetUserId === userId) {
          setNotifications(prev => [notif, ...prev])
        }
      })
      .subscribe()

    return () => { supabase.removeChannel(channel) }
  }, [userRole, userId])

  const markAsRead = async (id: string) => {
    await fetch(`/api/notifications/${id}/read`, { method: 'PATCH' })
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n))
  }

  const markAllAsRead = async () => {
    const unread = notifications.filter(n => !n.isRead)
    await Promise.all(unread.map(n => fetch(`/api/notifications/${n.id}/read`, { method: 'PATCH' })))
    setNotifications(prev => prev.map(n => ({ ...n, isRead: true })))
  }

  const unreadCount = notifications.filter(n => !n.isRead).length

  return { notifications, markAsRead, markAllAsRead, unreadCount }
}
