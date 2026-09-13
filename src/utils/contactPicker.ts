// Wraps the Contact Picker API (navigator.contacts.select), a real web
// standard for letting a page open the device's native Contacts picker.
//
// Support is narrow: Chrome for Android only, as of when this was written.
// It is NOT available on desktop browsers or on iOS Safari — there, the
// button that triggers this should be hidden or should show a clear
// message instead of silently doing nothing.
//
// Not yet in TypeScript's lib.dom.d.ts, so it's accessed through a small
// local type instead of scattering `any` through the calling code.
interface ContactsManagerLike {
  select: (
    properties: string[],
    options?: { multiple?: boolean }
  ) => Promise<Array<{ tel?: string[]; name?: string[] }>>;
}

function getContactsApi(): ContactsManagerLike | null {
  if (typeof navigator === "undefined") return null;
  if (!("contacts" in navigator) || !("ContactsManager" in window)) return null;
  return (navigator as unknown as { contacts: ContactsManagerLike }).contacts;
}

export function isContactPickerSupported(): boolean {
  return getContactsApi() !== null;
}

/**
 * Opens the device's native contact picker and returns the first phone
 * number from the selected contact, or null if the user cancelled, no
 * number was found, or the API isn't supported here.
 */
export async function pickPhoneNumber(): Promise<string | null> {
  const api = getContactsApi();
  if (!api) return null;
  try {
    const contacts = await api.select(["tel"], { multiple: false });
    const tel = contacts?.[0]?.tel?.[0];
    return tel ? tel.trim() : null;
  } catch {
    // User cancelled the picker, or denied permission — not an error worth
    // surfacing, the field just stays whatever it already was.
    return null;
  }
}
