'use client'

import { useState, useEffect } from 'react'
import { X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useSettings } from '@/contexts/settings-context'

interface ProfileModalProps {
  open: boolean
  onClose: () => void
}

export function ProfileModal({ open, onClose }: ProfileModalProps) {
  const { profile, setProfile, t } = useSettings()
  const [firstName, setFirstName] = useState(profile.firstName)
  const [lastName, setLastName] = useState(profile.lastName)
  const [region, setRegion] = useState(profile.region)
  const [phoneNo, setPhoneNo] = useState(profile.phoneNo)
  const [emailId, setEmailId] = useState(profile.emailId)
  const [isEditing, setIsEditing] = useState(false)

  // Sync local state with context when modal opens
  useEffect(() => {
    if (open) {
      setFirstName(profile.firstName)
      setLastName(profile.lastName)
      setRegion(profile.region)
      setPhoneNo(profile.phoneNo)
      setEmailId(profile.emailId)
      setIsEditing(false)
    }
  }, [open, profile])

  if (!open) return null

  const handleChangeInfo = () => {
    if (isEditing) {
      // Save changes to context
      setProfile({
        firstName,
        lastName,
        region,
        phoneNo,
        emailId,
      })
      setIsEditing(false)
    } else {
      setIsEditing(true)
    }
  }

  const handleClose = () => {
    // Reset to saved profile values
    setFirstName(profile.firstName)
    setLastName(profile.lastName)
    setRegion(profile.region)
    setPhoneNo(profile.phoneNo)
    setEmailId(profile.emailId)
    setIsEditing(false)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop with blur */}
      <div 
        className="absolute inset-0 bg-background/80 backdrop-blur-sm"
        onClick={handleClose}
      />
      
      {/* Modal */}
      <div className="relative z-10 w-full max-w-md rounded-lg border bg-card p-6 shadow-lg animate-in fade-in-0 zoom-in-95">
        {/* Close button */}
        <button
          onClick={handleClose}
          className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
        >
          <X className="size-4" />
          <span className="sr-only">{t('close')}</span>
        </button>

        {/* Header */}
        <div className="mb-6">
          <h2 className="text-xl font-semibold">{t('profile')}</h2>
          <p className="text-sm text-muted-foreground">Manage your profile information</p>
        </div>

        {/* Form */}
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="firstName">{t('first_name')}</Label>
              <Input
                id="firstName"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                disabled={!isEditing}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName">{t('last_name')}</Label>
              <Input
                id="lastName"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                disabled={!isEditing}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="region">{t('region')}</Label>
            <Select value={region} onValueChange={setRegion} disabled={!isEditing}>
              <SelectTrigger id="region">
                <SelectValue placeholder="Select region" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="asia">Asia Pacific</SelectItem>
                <SelectItem value="europe">Europe</SelectItem>
                <SelectItem value="americas">Americas</SelectItem>
                <SelectItem value="middle-east">Middle East</SelectItem>
                <SelectItem value="africa">Africa</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="phoneNo">{t('phone_no')}</Label>
            <Input
              id="phoneNo"
              value={phoneNo}
              onChange={(e) => setPhoneNo(e.target.value)}
              disabled={!isEditing}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="emailId">{t('email_id')}</Label>
            <Input
              id="emailId"
              type="email"
              value={emailId}
              onChange={(e) => setEmailId(e.target.value)}
              disabled={!isEditing}
            />
          </div>
        </div>

        {/* Footer buttons */}
        <div className="mt-6 flex justify-end gap-3">
          <Button variant="outline" onClick={handleClose}>
            {t('close')}
          </Button>
          <Button onClick={handleChangeInfo}>
            {isEditing ? 'Save Info' : t('change_info')}
          </Button>
        </div>
      </div>
    </div>
  )
}
