'use client'

import { useState, useEffect } from 'react'
import { useTranslations } from 'next-intl'
import { useRouter, useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function SettingsPage() {
  const t = useTranslations('settings')
  const params = useParams()
  const locale = params.locale as string
  const router = useRouter()
  const supabase = createClient()
  const [fullName, setFullName] = useState('')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return
      supabase
        .from('user_profiles')
        .select('full_name')
        .eq('id', user.id)
        .single()
        .then(({ data }) => {
          if (data) setFullName(data.full_name)
        })
    })
  }, [])

  async function handleSave() {
    setSaving(true)
    setSaved(false)
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      await supabase
        .from('user_profiles')
        .update({ full_name: fullName })
        .eq('id', user.id)
    }
    setSaving(false)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  function handleLocaleChange(newLocale: string) {
    const path = window.location.pathname.replace(`/${locale}`, `/${newLocale}`)
    router.push(path)
  }

  return (
    <div className="space-y-6 max-w-lg">
      <h1 className="text-2xl font-bold">{t('title')}</h1>
      <Card>
        <CardHeader><CardTitle>{t('profile')}</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1">
            <Label htmlFor="fullName">{t('fullName')}</Label>
            <Input
              id="fullName"
              value={fullName}
              onChange={e => setFullName(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-3">
            <Button onClick={handleSave} disabled={saving}>
              {saving ? '...' : t('save')}
            </Button>
            {saved && <span className="text-sm text-green-600">{t('saved')}</span>}
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle>{t('language')}</CardTitle></CardHeader>
        <CardContent className="flex gap-2">
          <Button
            variant={locale === 'es' ? 'default' : 'outline'}
            onClick={() => handleLocaleChange('es')}
          >
            Español
          </Button>
          <Button
            variant={locale === 'en' ? 'default' : 'outline'}
            onClick={() => handleLocaleChange('en')}
          >
            English
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}
