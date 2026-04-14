'use client'

import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useTranslations } from 'next-intl'
import { useRouter, useParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { createTicketSchema } from '@/lib/validations/ticket.schema'
import { z } from 'zod'

type FormValues = z.input<typeof createTicketSchema>

export function TicketForm() {
  const t = useTranslations('tickets.form')
  const router = useRouter()
  const params = useParams()
  const locale = params.locale as string

  const { register, handleSubmit, setValue, formState: { errors, isSubmitting } } = useForm<FormValues>({
    resolver: zodResolver(createTicketSchema),
    defaultValues: { priority: 'normal' },
  })

  async function onSubmit(data: FormValues) {
    const res = await fetch('/api/clickup/tickets', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    if (!res.ok) return
    const { ticket } = await res.json()
    router.push(`/${locale}/tickets/${ticket.id}`)
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 max-w-lg">
      <div className="space-y-1">
        <Label htmlFor="title">{t('titleLabel')}</Label>
        <Input
          id="title"
          placeholder={t('titlePlaceholder')}
          {...register('title')}
        />
        {errors.title && <p className="text-sm text-red-500">{errors.title.message}</p>}
      </div>
      <div className="space-y-1">
        <Label htmlFor="priority">{t('priorityLabel')}</Label>
        <Select
          defaultValue="normal"
          onValueChange={v => setValue('priority', v as FormValues['priority'])}
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="urgent">Urgent</SelectItem>
            <SelectItem value="high">High</SelectItem>
            <SelectItem value="normal">Normal</SelectItem>
            <SelectItem value="low">Low</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="flex gap-3">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? '...' : t('submit')}
        </Button>
        <Button type="button" variant="outline" onClick={() => router.back()}>
          {t('cancel')}
        </Button>
      </div>
    </form>
  )
}
