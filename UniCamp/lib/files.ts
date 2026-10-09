import { Alert } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import { supabase } from './supabase';

export const MAX_FILE_MB = 10;

// Opens a chat file using a link that expires after 5 minutes.
// (Better than a permanent public link: old links stop working.)
export async function openAttachment(path: string) {
  const { data, error } = await supabase.storage.from('chat-attachments').createSignedUrl(path, 300);
  if (error || !data) return Alert.alert('File', 'Could not open this file.');
  await WebBrowser.openBrowserAsync(data.signedUrl);
}
