'use client'

import React, { createContext, useContext, useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'

export interface UserProfile {
  firstName: string
  lastName: string
  emailId: string
  phoneNo: string
  region: string
}

type Language = 'en' | 'en-uk' | 'ar' | 'ja' | 'hi'
type AccentColor = 'blue' | 'red' | 'green' | 'yellow'

const translations: Record<Language, Record<string, string>> = {
  en: {
    conversational_bi: 'Conversational BI',
    current_chat: 'Chat',
    data_upload: 'Data Upload',
    insights: 'AI Insights',
    query_history: 'History',
    profile: 'Profile',
    settings: 'Settings',
    settings_description: 'Manage your dashboard preferences and data',
    help: 'Help',
    logout: 'Logout',
    notifications: 'Notifications',
    first_name: 'First Name',
    last_name: 'Last Name',
    region: 'Region',
    phone_no: 'Phone Number',
    email_id: 'Email',
    change_info: 'Change Info',
    close: 'Close',
    general: 'General',
    data: 'Data',
    appearance: 'Appearance',
    profile_description: 'Manage your account information',
    display_name: 'Display Name',
    email: 'Email',
    phone_number: 'Phone Number',
    time_zone: 'Time Zone',
    language: 'Language',
    language_description: 'Change the display language of the app.',
    ai_settings: 'AI Settings',
    ai_settings_description: 'Configure AI behavior for dashboard generation',
    ai_model: 'AI Model',
    auto_generate: 'Auto-generate insights',
    auto_generate_description: 'Automatically generate insights when data changes',
    save_changes: 'Save Changes',
    current_dataset: 'Current Dataset',
    dataset_description: 'Information about your uploaded data',
    no_dataset: 'No dataset loaded',
    upload_prompt: 'Upload a CSV file to start analyzing your data',
    upload_data: 'Upload Data',
    danger_zone: 'Danger Zone',
    danger_description: 'Irreversible actions that affect your data',
    clear_all_data: 'Clear All Data',
    clear_description: 'Remove uploaded dataset and query history',
    clear_data: 'Clear Data',
    theme: 'Theme',
    mode: 'Mode',
    system: 'System',
    light: 'Light',
    dark: 'Dark',
    accent_color: 'Accent Color',
    notification_preferences: 'Notification Preferences',
    responses: 'Responses',
    responses_description: 'Notifications for new AI responses',
    tasks: 'Tasks',
    tasks_description: 'Task completion notifications',
    projects: 'Projects',
    projects_description: 'Project update notifications',
    push: 'Push',
    push_email: 'Push + Email',
    data_uploaded: 'Data Uploaded',
    csv_sent: 'CSV Sent',
    new_dataset: 'New Dataset',
    last_login: 'Last Login',
    view_all: 'View all notifications',
    minutes_ago: 'minutes ago',
    hour_ago: 'hour ago',
    today_at: 'Today at',
    uploaded_files: 'Uploaded Files',
    select_file: 'Select a file to analyze',
    no_files: 'No files uploaded yet',
    upload_first: 'Upload your first CSV to get started',
    file_selected: 'File selected',
    analyze: 'Analyze',
    rows: 'rows',
    columns: 'columns',
    uploaded: 'uploaded',
  },
  'en-uk': {
    conversational_bi: 'Conversational BI',
    current_chat: 'Chat',
    data_upload: 'Data Upload',
    insights: 'AI Insights',
    query_history: 'History',
    profile: 'Profile',
    settings: 'Settings',
    settings_description: 'Manage your dashboard preferences and data',
    help: 'Help',
    logout: 'Log out',
    notifications: 'Notifications',
    first_name: 'First Name',
    last_name: 'Surname',
    region: 'Region',
    phone_no: 'Phone Number',
    email_id: 'Email Address',
    change_info: 'Update Info',
    close: 'Close',
    general: 'General',
    data: 'Data',
    appearance: 'Appearance',
    profile_description: 'Manage your account information',
    display_name: 'Display Name',
    email: 'Email Address',
    phone_number: 'Phone Number',
    time_zone: 'Time Zone',
    language: 'Language',
    language_description: 'Change the display language of the application.',
    ai_settings: 'AI Settings',
    ai_settings_description: 'Configure AI behaviour for dashboard generation',
    ai_model: 'AI Model',
    auto_generate: 'Auto-generate insights',
    auto_generate_description: 'Automatically generate insights when data changes',
    save_changes: 'Save Changes',
    current_dataset: 'Current Dataset',
    dataset_description: 'Information about your uploaded data',
    no_dataset: 'No dataset loaded',
    upload_prompt: 'Upload a CSV file to start analysing your data',
    upload_data: 'Upload Data',
    danger_zone: 'Danger Zone',
    danger_description: 'Irreversible actions that affect your data',
    clear_all_data: 'Clear All Data',
    clear_description: 'Remove uploaded dataset and query history',
    clear_data: 'Clear Data',
    theme: 'Theme',
    mode: 'Mode',
    system: 'System',
    light: 'Light',
    dark: 'Dark',
    accent_color: 'Accent Colour',
    notification_preferences: 'Notification Preferences',
    responses: 'Responses',
    responses_description: 'Notifications for new AI responses',
    tasks: 'Tasks',
    tasks_description: 'Task completion notifications',
    projects: 'Projects',
    projects_description: 'Project update notifications',
    push: 'Push',
    push_email: 'Push + Email',
    data_uploaded: 'Data Uploaded',
    csv_sent: 'CSV Sent',
    new_dataset: 'New Dataset',
    last_login: 'Last Login',
    view_all: 'View all notifications',
    minutes_ago: 'minutes ago',
    hour_ago: 'hour ago',
    today_at: 'Today at',
    uploaded_files: 'Uploaded Files',
    select_file: 'Select a file to analyse',
    no_files: 'No files uploaded yet',
    upload_first: 'Upload your first CSV to get started',
    file_selected: 'File selected',
    analyze: 'Analyse',
    rows: 'rows',
    columns: 'columns',
    uploaded: 'uploaded',
  },
  ar: {
    conversational_bi: 'BI تحادثي',
    current_chat: 'المحادثة',
    data_upload: 'رفع البيانات',
    insights: 'رؤى الذكاء الاصطناعي',
    query_history: 'التاريخ',
    profile: 'الملف الشخصي',
    settings: 'الإعدادات',
    settings_description: 'إدارة تفضيلات لوحة التحكم',
    help: 'مساعدة',
    logout: 'تسجيل الخروج',
    notifications: 'الإشعارات',
    first_name: 'الاسم الأول',
    last_name: 'اسم العائلة',
    region: 'المنطقة',
    phone_no: 'رقم الهاتف',
    email_id: 'البريد الإلكتروني',
    change_info: 'تغيير المعلومات',
    close: 'إغلاق',
    general: 'عام',
    data: 'البيانات',
    appearance: 'المظهر',
    profile_description: 'إدارة معلومات حسابك',
    display_name: 'اسم العرض',
    email: 'البريد الإلكتروني',
    phone_number: 'رقم الهاتف',
    time_zone: 'المنطقة الزمنية',
    language: 'اللغة',
    language_description: 'تغيير لغة التطبيق.',
    ai_settings: 'إعدادات الذكاء الاصطناعي',
    ai_settings_description: 'تكوين الذكاء الاصطناعي لإنشاء لوحة التحكم',
    ai_model: 'نموذج الذكاء الاصطناعي',
    auto_generate: 'إنشاء رؤى تلقائية',
    auto_generate_description: 'إنشاء رؤى تلقائية عند تغيير البيانات',
    save_changes: 'حفظ التغييرات',
    current_dataset: 'مجموعة البيانات الحالية',
    dataset_description: 'معلومات حول بياناتك المرفوعة',
    no_dataset: 'لم يتم تحميل أي مجموعة بيانات',
    upload_prompt: 'ارفع ملف CSV لبدء تحليل بياناتك',
    upload_data: 'رفع البيانات',
    danger_zone: 'منطقة الخطر',
    danger_description: 'إجراءات لا يمكن التراجع عنها',
    clear_all_data: 'مسح جميع البيانات',
    clear_description: 'إزالة مجموعة البيانات المرفوعة وسجل الاستعلامات',
    clear_data: 'مسح البيانات',
    theme: 'السمة',
    mode: 'الوضع',
    system: 'النظام',
    light: 'فاتح',
    dark: 'داكن',
    accent_color: 'لون التمييز',
    notification_preferences: 'تفضيلات الإشعارات',
    responses: 'الردود',
    responses_description: 'إشعارات الردود الجديدة',
    tasks: 'المهام',
    tasks_description: 'إشعارات إتمام المهام',
    projects: 'المشاريع',
    projects_description: 'إشعارات تحديثات المشاريع',
    push: 'دفع',
    push_email: 'دفع + بريد',
    data_uploaded: 'تم رفع البيانات',
    csv_sent: 'تم إرسال CSV',
    new_dataset: 'مجموعة بيانات جديدة',
    last_login: 'آخر تسجيل دخول',
    view_all: 'عرض جميع الإشعارات',
    minutes_ago: 'دقائق مضت',
    hour_ago: 'ساعة مضت',
    today_at: 'اليوم في',
    uploaded_files: 'الملفات المرفوعة',
    select_file: 'اختر ملفاً للتحليل',
    no_files: 'لا توجد ملفات مرفوعة',
    upload_first: 'ارفع أول ملف CSV للبدء',
    file_selected: 'تم اختيار الملف',
    analyze: 'تحليل',
    rows: 'صفوف',
    columns: 'أعمدة',
    uploaded: 'مرفوع',
  },
  ja: {
    conversational_bi: 'Conversational BI',
    current_chat: 'チャット',
    data_upload: 'データアップロード',
    insights: 'AIインサイト',
    query_history: '履歴',
    profile: 'プロフィール',
    settings: '設定',
    settings_description: 'ダッシュボードの設定を管理',
    help: 'ヘルプ',
    logout: 'ログアウト',
    notifications: '通知',
    first_name: '名',
    last_name: '姓',
    region: '地域',
    phone_no: '電話番号',
    email_id: 'メール',
    change_info: '情報を変更',
    close: '閉じる',
    general: '一般',
    data: 'データ',
    appearance: '外観',
    profile_description: 'アカウント情報を管理',
    display_name: '表示名',
    email: 'メール',
    phone_number: '電話番号',
    time_zone: 'タイムゾーン',
    language: '言語',
    language_description: 'アプリの表示言語を変更します。',
    ai_settings: 'AI設定',
    ai_settings_description: 'ダッシュボード生成のAI設定',
    ai_model: 'AIモデル',
    auto_generate: 'インサイト自動生成',
    auto_generate_description: 'データ変更時に自動的にインサイトを生成',
    save_changes: '変更を保存',
    current_dataset: '現在のデータセット',
    dataset_description: 'アップロードされたデータの情報',
    no_dataset: 'データセットが読み込まれていません',
    upload_prompt: 'CSVファイルをアップロードして分析を開始',
    upload_data: 'データをアップロード',
    danger_zone: '危険ゾーン',
    danger_description: '元に戻せない操作',
    clear_all_data: 'すべてのデータをクリア',
    clear_description: 'アップロードされたデータセットとクエリ履歴を削除',
    clear_data: 'データをクリア',
    theme: 'テーマ',
    mode: 'モード',
    system: 'システム',
    light: 'ライト',
    dark: 'ダーク',
    accent_color: 'アクセントカラー',
    notification_preferences: '通知設定',
    responses: '返答',
    responses_description: '新しいAI返答の通知',
    tasks: 'タスク',
    tasks_description: 'タスク完了通知',
    projects: 'プロジェクト',
    projects_description: 'プロジェクト更新通知',
    push: 'プッシュ',
    push_email: 'プッシュ + メール',
    data_uploaded: 'データがアップロードされました',
    csv_sent: 'CSVが送信されました',
    new_dataset: '新しいデータセット',
    last_login: '最終ログイン',
    view_all: 'すべての通知を表示',
    minutes_ago: '分前',
    hour_ago: '時間前',
    today_at: '今日',
    uploaded_files: 'アップロードされたファイル',
    select_file: '分析するファイルを選択',
    no_files: 'ファイルがまだありません',
    upload_first: '最初のCSVをアップロードして開始',
    file_selected: 'ファイルが選択されました',
    analyze: '分析',
    rows: '行',
    columns: '列',
    uploaded: 'アップロード済み',
  },
  hi: {
    conversational_bi: 'Conversational BI',
    current_chat: 'चैट',
    data_upload: 'डेटा अपलोड',
    insights: 'AI इनसाइट्स',
    query_history: 'इतिहास',
    profile: 'प्रोफ़ाइल',
    settings: 'सेटिंग्स',
    settings_description: 'अपने डैशबोर्ड की प्राथमिकताएं प्रबंधित करें',
    help: 'सहायता',
    logout: 'लॉगआउट',
    notifications: 'सूचनाएं',
    first_name: 'पहला नाम',
    last_name: 'उपनाम',
    region: 'क्षेत्र',
    phone_no: 'फ़ोन नंबर',
    email_id: 'ईमेल',
    change_info: 'जानकारी बदलें',
    close: 'बंद करें',
    general: 'सामान्य',
    data: 'डेटा',
    appearance: 'दिखावट',
    profile_description: 'अपने खाते की जानकारी प्रबंधित करें',
    display_name: 'प्रदर्शन नाम',
    email: 'ईमेल',
    phone_number: 'फ़ोन नंबर',
    time_zone: 'समय क्षेत्र',
    language: 'भाषा',
    language_description: 'ऐप की प्रदर्शन भाषा बदलें।',
    ai_settings: 'AI सेटिंग्स',
    ai_settings_description: 'डैशबोर्ड जनरेशन के लिए AI कॉन्फ़िगर करें',
    ai_model: 'AI मॉडल',
    auto_generate: 'इनसाइट्स स्वतः उत्पन्न करें',
    auto_generate_description: 'डेटा बदलने पर स्वतः इनसाइट्स उत्पन्न करें',
    save_changes: 'परिवर्तन सहेजें',
    current_dataset: 'वर्तमान डेटासेट',
    dataset_description: 'आपके अपलोड किए गए डेटा की जानकारी',
    no_dataset: 'कोई डेटासेट लोड नहीं',
    upload_prompt: 'अपना डेटा विश्लेषण शुरू करने के लिए CSV फ़ाइल अपलोड करें',
    upload_data: 'डेटा अपलोड करें',
    danger_zone: 'खतरे का क्षेत्र',
    danger_description: 'अपरिवर्तनीय क्रियाएं जो आपके डेटा को प्रभावित करती हैं',
    clear_all_data: 'सभी डेटा साफ करें',
    clear_description: 'अपलोड किया गया डेटासेट और क्वेरी इतिहास हटाएं',
    clear_data: 'डेटा साफ करें',
    theme: 'थीम',
    mode: 'मोड',
    system: 'सिस्टम',
    light: 'लाइट',
    dark: 'डार्क',
    accent_color: 'एक्सेंट रंग',
    notification_preferences: 'सूचना प्राथमिकताएं',
    responses: 'प्रतिक्रियाएं',
    responses_description: 'नई AI प्रतिक्रियाओं की सूचनाएं',
    tasks: 'कार्य',
    tasks_description: 'कार्य पूर्णता सूचनाएं',
    projects: 'प्रोजेक्ट',
    projects_description: 'प्रोजेक्ट अपडेट सूचनाएं',
    push: 'पुश',
    push_email: 'पुश + ईमेल',
    data_uploaded: 'डेटा अपलोड हुआ',
    csv_sent: 'CSV भेजा गया',
    new_dataset: 'नया डेटासेट',
    last_login: 'अंतिम लॉगिन',
    view_all: 'सभी सूचनाएं देखें',
    minutes_ago: 'मिनट पहले',
    hour_ago: 'घंटे पहले',
    today_at: 'आज',
    uploaded_files: 'अपलोड की गई फ़ाइलें',
    select_file: 'विश्लेषण के लिए फ़ाइल चुनें',
    no_files: 'अभी कोई फ़ाइल नहीं',
    upload_first: 'शुरू करने के लिए पहला CSV अपलोड करें',
    file_selected: 'फ़ाइल चुनी गई',
    analyze: 'विश्लेषण करें',
    rows: 'पंक्तियां',
    columns: 'स्तंभ',
    uploaded: 'अपलोड',
  },
}

interface SettingsContextType {
  profile: UserProfile
  setProfile: (profile: UserProfile) => void
  language: Language
  setLanguage: (lang: Language) => void
  accentColor: AccentColor
  setAccentColor: (color: AccentColor) => void
  t: (key: string) => string
}

const defaultProfile: UserProfile = {
  firstName: 'User',
  lastName: '',
  emailId: 'user@example.com',
  phoneNo: '',
  region: 'asia',
}

const SettingsContext = createContext<SettingsContextType>({
  profile: defaultProfile,
  setProfile: () => {},
  language: 'en',
  setLanguage: () => {},
  accentColor: 'blue',
  setAccentColor: () => {},
  t: (k) => k,
})

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [profile, setProfileState] = useState<UserProfile>(defaultProfile)
  const [language, setLanguageState] = useState<Language>('en')
  const [accentColor, setAccentColorState] = useState<AccentColor>('blue')

  const { data: session } = useSession()

  // Sync profile state with Next-Auth session when it changes
  useEffect(() => {
    if (session?.user) {
      const email = session.user.email || ""
      const fullName = session.user.name || ""
      const [first = "", ...lasts] = fullName.split(" ")
      const last = lasts.join(" ")
      
      let mappedRegion = "asia"
      if (session.user.country) {
        const countryLower = session.user.country.toLowerCase()
        if (
          countryLower.includes("us") || 
          countryLower.includes("united states") || 
          countryLower.includes("america")
        ) {
          mappedRegion = "americas"
        } else if (
          countryLower.includes("europe") || 
          countryLower.includes("uk") || 
          countryLower.includes("germany") || 
          countryLower.includes("france")
        ) {
          mappedRegion = "europe"
        } else if (countryLower.includes("east")) {
          mappedRegion = "middle-east"
        } else if (countryLower.includes("africa")) {
          mappedRegion = "africa"
        } else {
          mappedRegion = "asia"
        }
      }

      setProfileState({
        firstName: first || "User",
        lastName: last || "",
        emailId: email || "user@example.com",
        phoneNo: session.user.phone || "",
        region: mappedRegion,
      })
    }
  }, [session])

  // Load from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem('cbi-settings')
      if (saved) {
        const parsed = JSON.parse(saved)
        if (parsed.profile) setProfileState(parsed.profile)
        if (parsed.language) setLanguageState(parsed.language)
        if (parsed.accentColor) setAccentColorState(parsed.accentColor)
      }
    } catch {}
  }, [])

  // Save to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(
        'cbi-settings',
        JSON.stringify({ profile, language, accentColor })
      )
    } catch {}
  }, [profile, language, accentColor])

  // Apply accent color to root
  useEffect(() => {
    document.documentElement.setAttribute('data-accent', accentColor)
  }, [accentColor])

  const setProfile = (p: UserProfile) => setProfileState(p)
  const setLanguage = (l: Language) => setLanguageState(l)
  const setAccentColor = (c: AccentColor) => setAccentColorState(c)

  const t = (key: string): string => {
    return translations[language]?.[key] ?? translations['en']?.[key] ?? key
  }

  return (
    <SettingsContext.Provider
      value={{ profile, setProfile, language, setLanguage, accentColor, setAccentColor, t }}
    >
      {children}
    </SettingsContext.Provider>
  )
}

export const useSettings = () => useContext(SettingsContext)
