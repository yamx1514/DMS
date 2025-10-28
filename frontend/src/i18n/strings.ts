export type Locale = 'en';

type Dictionary = Record<string, string>;

const en: Dictionary = {
  'permissions.shareModal.title': 'Share document',
  'permissions.shareModal.bulkTitle': 'Share selected documents',
  'permissions.shareModal.publicTabLabel': 'Public access',
  'permissions.shareModal.publicDescription': 'Anyone with the link can view the document.',
  'permissions.shareModal.restrictedTabLabel': 'Restricted domains',
  'permissions.shareModal.restrictedDescription': 'Limit access to collaborators with specific email domains.',
  'permissions.shareModal.accountTabLabel': 'Specific collaborators',
  'permissions.shareModal.accountDescription': 'Share with individual teammates and set their permissions.',
  'permissions.shareModal.auditTitle': 'Current collaborators',
  'permissions.shareModal.auditEmpty': 'No collaborators yet.',
  'permissions.shareModal.addDomainPlaceholder': 'Enter domain (example.com)',
  'permissions.shareModal.addAccountPlaceholder': 'Search teammates by email',
  'permissions.shareModal.permission.read': 'Can view',
  'permissions.shareModal.permission.comment': 'Can comment',
  'permissions.shareModal.permission.edit': 'Can edit',
  'permissions.shareModal.save': 'Save',
  'permissions.shareModal.cancel': 'Cancel',
  'permissions.shareModal.remove': 'Remove',
  'permissions.shareModal.edit': 'Edit',
  'permissions.shareModal.validation.domainRequired': 'Add at least one domain.',
  'permissions.shareModal.validation.accountRequired': 'Add at least one collaborator.',
  'permissions.shareModal.error.generic': 'We could not update the permissions. Please try again.'
};

const dictionaries: Record<Locale, Dictionary> = { en };

let activeLocale: Locale = 'en';

export const setLocale = (locale: Locale) => {
  if (!dictionaries[locale]) {
    throw new Error(`Unsupported locale: ${locale}`);
  }
  activeLocale = locale;
};

export const t = (key: string) => {
  const dictionary = dictionaries[activeLocale] ?? {};
  return dictionary[key] ?? key;
};
