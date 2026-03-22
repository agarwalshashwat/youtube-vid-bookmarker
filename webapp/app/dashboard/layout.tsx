import { redirect } from 'next/navigation';
import { Suspense } from 'react';
import { createServerSupabase } from '@/lib/supabase';
import DashboardChrome from './_components/DashboardChrome';

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = await createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/signin');

  const { data: profileData } = await supabase
    .from('profiles')
    .select('username, avatar_url, is_pro')
    .eq('id', user.id)
    .single();

  const username = profileData?.username ?? user.email?.split('@')[0] ?? 'curator';
  const avatarUrl = (profileData?.avatar_url as string | null) ?? null;
  const avatarInitial = username[0].toUpperCase();
  const isPro = (profileData?.is_pro as boolean | null) ?? false;

  return (
    <Suspense>
      <DashboardChrome username={username} avatarInitial={avatarInitial} avatarUrl={avatarUrl} isPro={isPro}>
        {children}
      </DashboardChrome>
    </Suspense>
  );
}
