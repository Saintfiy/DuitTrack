'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import type { User as AppUser, Business } from '@/types';

export function useAuth({ requireAuth = false } = {}) {
  const router = useRouter();
  const [user, setUser] = useState<AppUser | null>(null);
  const [business, setBusiness] = useState<Business | null>(null);
  const [loading, setLoading] = useState(true);

  const loadUserData = useCallback(async (userId: string) => {
    try {
      const { data: userData } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      if (userData) {
        setUser(userData);
        // Find business: either linked directly or owned by user
        const businessId = userData.business_id;
        if (businessId) {
          const { data: biz } = await supabase
            .from('businesses')
            .select('*')
            .eq('id', businessId)
            .maybeSingle();
          setBusiness(biz);
          if (biz?.currency) {
            localStorage.setItem('business_currency', biz.currency);
          }
        } else {
          const { data: ownedBiz } = await supabase
            .from('businesses')
            .select('*')
            .eq('owner_id', userId)
            .limit(1)
            .maybeSingle();
          if (ownedBiz) {
            setBusiness(ownedBiz);
            if (ownedBiz.currency) {
              localStorage.setItem('business_currency', ownedBiz.currency);
            }
            // Keep user record in sync
            await supabase
              .from('users')
              .update({ business_id: ownedBiz.id })
              .eq('id', userId);
          }
        }
      }
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        loadUserData(session.user.id);
      } else {
        setLoading(false);
        if (requireAuth) router.push('/login');
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (session?.user) {
          loadUserData(session.user.id);
        } else {
          setUser(null);
          setBusiness(null);
          setLoading(false);
          if (requireAuth) router.push('/login');
        }
      }
    );

    return () => subscription.unsubscribe();
  }, [loadUserData, requireAuth, router]);

  const logout = async () => {
    await supabase.auth.signOut();
    router.push('/login');
  };

  return {
    user,
    business,
    loading,
    logout,
    isAuthenticated: !!user,
    businessId: business?.id ?? null,
    workspaceType: business?.workspace_type ?? 'business',
  };
}
