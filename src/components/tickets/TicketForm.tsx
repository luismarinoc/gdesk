'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useTranslations } from 'next-intl'
import { useRouter, useParams } from 'next/navigation'
import { Flag, Paperclip } from 'lucide-react'
import { createTicketSchema } from '@/lib/validations/ticket.schema'
import { z } from 'zod'

type FormValues = z.input<typeof createTicketSchema>

const PRIORITY_COLORS: Record<string, string> = {
  urgent: 'text-red-500',
  high: 'text-orange-500',
  normal: 'text-blue-500',
  low: 'text-gray-400',
}

export function TicketForm() {
  const t = useTranslations('tickets.form')
  const tp = useTranslations('tickets.priorities')
  const router = useRouter()
  const params = useParams()
  const locale = params.locale as string
  const [submitError, setSubmitError] = useState('')
  const [dragOver, setDragOver] = useState(false)
  const [files, setFiles] = useState<File[]>([])

  const { register, handleSubmit, setValue, watch, formState: { errors, isSubmitting } } = useForm<FormValues>({
    resolver: zodResolver(createTicketSchema),
    defaultValues: { priority: 'normal', type: 'consulta' },
  })

  const selectedPriority = watch('priority')

  function handleFiles(fileList: FileList | null) {
    if (!fileList) return
    setFiles(prev => [...prev, ...Array.from(fileList)])
  }

  async function onSubmit(data: FormValues) {
    setSubmitError('')
    try {
      const res = await fetch('/api/clickup/tickets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })
      if (!res.ok) {
        setSubmitError('Error al crear el ticket')
        return
      }
      const { ticket } = await res.json()
      router.push(`/${locale}/tickets/${ticket.id}`)
    } catch {
      setSubmitError('Error al crear el ticket')
    }
  }

  return (
    <div className="bg-white rounded-xl shadow-sm max-w-2xl mx-auto">
      {/* Header */}
      <div className="px-8 py-6 border-b border-gray-100">
        <h2 className="text-xl font-bold text-gray-900">Soporte GPartner</h2>
        <p className="text-sm text-gray-500 mt-1">
          Puedes generar una solicitud de soporte con las opciones proporcionadas.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="px-8 py-6 space-y-5">
        {/* Tipo */}
        <div className="space-y-1.5">
          <label className="block text-sm font-medium text-gray-700">
            {t('typeLabel')} <span className="text-red-500">*</span>
          </label>
          <select
            {...register('type')}
            className="w-full px-3 py-2.5 bg-gray-50 border-0 rounded-lg text-sm text-gray-700 focus:ring-2 focus:ring-[#1B3A6B]/20 focus:bg-white transition-colors appearance-none cursor-pointer"
            style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%236b7280' stroke-width='2'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 12px center' }}
          >
            <option value="">{t('typePlaceholder')}</option>
            <option value="bug">{t('types.bug')}</option>
            <option value="consulta">{t('types.consulta')}</option>
            <option value="cambio">{t('types.cambio')}</option>
            <option value="acceso">{t('types.acceso')}</option>
            <option value="otro">{t('types.otro')}</option>
          </select>
          {errors.type && <p className="text-xs text-red-500">{errors.type.message}</p>}
        </div>

        {/* Resumen */}
        <div className="space-y-1.5">
          <label className="block text-sm font-medium text-gray-700">
            {t('titleLabel')} <span className="text-red-500">*</span>
          </label>
          <input
            {...register('title')}
            placeholder={t('titlePlaceholder')}
            className="w-full px-3 py-2.5 bg-gray-50 border-0 rounded-lg text-sm text-gray-700 placeholder-gray-400 focus:ring-2 focus:ring-[#1B3A6B]/20 focus:bg-white transition-colors"
          />
          {errors.title && <p className="text-xs text-red-500">{errors.title.message}</p>}
        </div>

        {/* Descripción */}
        <div className="space-y-1.5">
          <label className="block text-sm font-medium text-gray-700">
            {t('descriptionLabel')} <span className="text-red-500">*</span>
          </label>
          <textarea
            {...register('description')}
            placeholder={t('descriptionPlaceholder')}
            rows={4}
            className="w-full px-3 py-2.5 bg-gray-50 border-0 rounded-lg text-sm text-gray-700 placeholder-gray-400 focus:ring-2 focus:ring-[#1B3A6B]/20 focus:bg-white transition-colors resize-none"
          />
          {errors.description && <p className="text-xs text-red-500">{errors.description.message}</p>}
        </div>

        {/* Prioridad */}
        <div className="space-y-1.5">
          <label className="block text-sm font-medium text-gray-700">
            {t('priorityLabel')} <span className="text-red-500">*</span>
          </label>
          <div className="relative">
            <Flag className={`absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 ${selectedPriority ? PRIORITY_COLORS[selectedPriority] ?? 'text-gray-400' : 'text-gray-400'}`} />
            <select
              {...register('priority')}
              className="w-full pl-9 pr-3 py-2.5 bg-gray-50 border-0 rounded-lg text-sm text-gray-700 focus:ring-2 focus:ring-[#1B3A6B]/20 focus:bg-white transition-colors appearance-none cursor-pointer"
              style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%236b7280' stroke-width='2'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 12px center' }}
            >
              <option value="">{t('priorityPlaceholder')}</option>
              <option value="urgent">{tp('urgent')}</option>
              <option value="high">{tp('high')}</option>
              <option value="normal">{tp('normal')}</option>
              <option value="low">{tp('low')}</option>
            </select>
          </div>
          {errors.priority && <p className="text-xs text-red-500">{errors.priority.message}</p>}
        </div>

        {/* Módulo */}
        <div className="space-y-1.5">
          <label className="block text-sm font-medium text-gray-700">
            {t('moduleLabel')} <span className="text-red-500">*</span>
          </label>
          <select
            {...register('module')}
            className="w-full px-3 py-2.5 bg-gray-50 border-0 rounded-lg text-sm text-gray-700 focus:ring-2 focus:ring-[#1B3A6B]/20 focus:bg-white transition-colors appearance-none cursor-pointer"
            style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%236b7280' stroke-width='2'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E")`, backgroundRepeat: 'no-repeat', backgroundPosition: 'right 12px center' }}
          >
            <option value="">{t('modulePlaceholder')}</option>
            <option value="sap_fi">{t('modules.sap_fi')}</option>
            <option value="sap_co">{t('modules.sap_co')}</option>
            <option value="sap_sd">{t('modules.sap_sd')}</option>
            <option value="sap_mm">{t('modules.sap_mm')}</option>
            <option value="sap_pp">{t('modules.sap_pp')}</option>
            <option value="sap_hr">{t('modules.sap_hr')}</option>
            <option value="sap_basis">{t('modules.sap_basis')}</option>
            <option value="sap_abap">{t('modules.sap_abap')}</option>
            <option value="otro">{t('modules.otro')}</option>
          </select>
          {errors.module && <p className="text-xs text-red-500">{errors.module.message}</p>}
        </div>

        {/* Adjunto */}
        <div className="space-y-1.5">
          <label className="block text-sm font-medium text-gray-700">
            {t('attachmentLabel')}
          </label>
          <div
            onDragOver={e => { e.preventDefault(); setDragOver(true) }}
            onDragLeave={() => setDragOver(false)}
            onDrop={e => { e.preventDefault(); setDragOver(false); handleFiles(e.dataTransfer.files) }}
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer ${dragOver ? 'border-[#1B3A6B] bg-blue-50' : 'border-gray-200 bg-gray-50'}`}
            onClick={() => document.getElementById('file-input')?.click()}
          >
            <Paperclip className="w-5 h-5 text-gray-400 mx-auto mb-2" />
            <p className="text-sm text-gray-500">
              Suelta los archivos aquí para{' '}
              <span className="text-[#1B3A6B] underline cursor-pointer">subirlos</span>
            </p>
            <input
              id="file-input"
              type="file"
              multiple
              className="hidden"
              onChange={e => handleFiles(e.target.files)}
            />
          </div>
          {files.length > 0 && (
            <ul className="text-xs text-gray-500 space-y-1 mt-2">
              {files.map((f, i) => <li key={i} className="flex items-center gap-1"><Paperclip className="w-3 h-3" />{f.name}</li>)}
            </ul>
          )}
        </div>

        {submitError && <p className="text-sm text-red-500">{submitError}</p>}

        {/* Buttons */}
        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            disabled={isSubmitting}
            className="flex-1 py-3 bg-[#1B3A6B] text-white font-semibold rounded-lg hover:bg-[#152d55] transition-colors disabled:opacity-60"
          >
            {isSubmitting ? 'Enviando...' : t('submit')}
          </button>
          <button
            type="button"
            onClick={() => router.back()}
            className="px-6 py-3 bg-gray-100 text-gray-600 font-semibold rounded-lg hover:bg-gray-200 transition-colors"
          >
            {t('cancel')}
          </button>
        </div>
      </form>
    </div>
  )
}
