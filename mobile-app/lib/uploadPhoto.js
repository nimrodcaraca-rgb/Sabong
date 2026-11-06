import { supabase } from './supabase';

export const uploadPhotoToSupabase = async (userId, localUri) => {
  if (!localUri) return null;

  const fileExt = (localUri.split('.').pop() || 'jpg').toLowerCase().split('?')[0];
  const fileName = `${userId}/${Date.now()}.${fileExt}`;
  const contentType = `image/${fileExt === 'jpg' ? 'jpeg' : fileExt}`;

  const response = await fetch(localUri);
  const blob = await response.blob();

  const arrayBuffer = await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsArrayBuffer(blob);
  });

  const { error } = await supabase.storage
    .from('rooster-photos')
    .upload(fileName, arrayBuffer, { contentType, upsert: true });

  if (error) throw error;

  const { data: urlData } = supabase.storage
    .from('rooster-photos')
    .getPublicUrl(fileName);

  return urlData.publicUrl;
};
