'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import activityLogService, { AuditLogParams } from '../../../../services/activity-log.service'

interface AuditLogEntry {
  id: string
  action: string
  entityType: string
  entityId: string
  description: string
  timestamp: string
  userName: string
  userRole: string
  user?: { name: string; role: string }
}

interface Meta {
  total: number
  page: number
  limit: number
  totalPages: number
}

export default function AuditLogPage() {
  const [params, setParams] = useState<AuditLogParams>({ page: 1, limit: 20 })

  const { data, isLoading, isError } = useQuery({
    queryKey: ['audit-log', params],
    queryFn: () => activityLogService.getAll(params),
  })

  const logs: AuditLogEntry[] = data?.data ?? []
  const meta: Meta = data?.meta ?? { total: 0, page: 1, limit: 20, totalPages: 1 }

  const handleFilter = (key: keyof AuditLogParams, value: string) => {
    setParams((prev) => ({ ...prev, [key]: value || undefined, page: 1 }))
  }

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-2xl font-semibold">Audit Log</h1>

      {/* Filter Bar */}
      <div className="flex flex-wrap gap-3">
        <input
          type="text"
          placeholder="Filter action..."
          className="border rounded px-3 py-1.5 text-sm"
          onChange={(e) => handleFilter('action', e.target.value)}
        />
        <input
          type="text"
          placeholder="Filter entity type..."
          className="border rounded px-3 py-1.5 text-sm"
          onChange={(e) => handleFilter('entityType', e.target.value)}
        />
        <input
          type="date"
          className="border rounded px-3 py-1.5 text-sm"
          onChange={(e) => handleFilter('dateFrom', e.target.value)}
        />
        <input
          type="date"
          className="border rounded px-3 py-1.5 text-sm"
          onChange={(e) => handleFilter('dateTo', e.target.value)}
        />
      </div>

      {isLoading && <p className="text-sm text-gray-500">Memuat data...</p>}
      {isError && <p className="text-sm text-red-500">Gagal memuat audit log.</p>}

      {!isLoading && (
        <div className="overflow-x-auto rounded border">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50 text-left text-xs uppercase text-gray-500">
              <tr>
                <th className="px-4 py-3">Waktu</th>
                <th className="px-4 py-3">User</th>
                <th className="px-4 py-3">Action</th>
                <th className="px-4 py-3">Entity</th>
                <th className="px-4 py-3">Deskripsi</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {logs.map((log) => (
                <tr key={log.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 whitespace-nowrap text-gray-500">
                    {new Date(log.timestamp).toLocaleString('id-ID')}
                  </td>
                  <td className="px-4 py-3">
                    <div className="font-medium">{log.user?.name ?? log.userName}</div>
                    <div className="text-xs text-gray-400">{log.user?.role ?? log.userRole}</div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="inline-block rounded bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700">
                      {log.action}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{log.entityType}</td>
                  <td className="px-4 py-3 text-gray-700">{log.description}</td>
                </tr>
              ))}
              {logs.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-4 py-6 text-center text-gray-400">
                    Tidak ada data
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Pagination */}
      <div className="flex items-center justify-between text-sm text-gray-600">
        <span>Total: {meta.total} entri</span>
        <div className="flex gap-2">
          <button
            disabled={meta.page <= 1}
            onClick={() => setParams((p) => ({ ...p, page: p.page! - 1 }))}
            className="rounded border px-3 py-1 disabled:opacity-40"
          >
            Sebelumnya
          </button>
          <span className="px-2 py-1">
            {meta.page} / {meta.totalPages}
          </span>
          <button
            disabled={meta.page >= meta.totalPages}
            onClick={() => setParams((p) => ({ ...p, page: p.page! + 1 }))}
            className="rounded border px-3 py-1 disabled:opacity-40"
          >
            Selanjutnya
          </button>
        </div>
      </div>
    </div>
  )
}
