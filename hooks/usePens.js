import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../context/AuthContext';

export const usePens = () => {
  const { user } = useAuth();
  const [pens, setPens] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchPens = async () => {
    if (!user) return;
    const { data, error } = await supabase
      .from('pens')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (!error) setPens(data || []);
    setLoading(false);
  };

  const createPen = async (name, location, notes) => {
    const { data, error } = await supabase
      .from('pens')
      .insert({ user_id: user.id, name, location, notes })
      .select()
      .single();
    if (!error) setPens(prev => [data, ...prev]);
    return { data, error };
  };

  useEffect(() => {
    fetchPens();
  }, [user]);

  return { pens, loading, fetchPens, createPen };
};