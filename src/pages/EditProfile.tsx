"use client";

import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, Camera, Music, Link as LinkIcon, User, Info } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/auth/AuthProvider';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { showSuccess, showError } from '@/utils/toast';

const EditProfile = () => {
  const navigate = useNavigate();
  const { session } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState({
    first_name: '',
    username: '',
    bio: '',
    avatar_url: '',
    favorite_music: '',
    gender: '',
    links: ''
  });

  useEffect(() => {
    if (session?.user) {
      fetchProfile();
    }
  }, [session]);

  const fetchProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session?.user.id)
        .single();

      if (error) throw error;
      if (data) {
        setFormData({
          first_name: data.first_name || '',
          username: data.username || '',
          bio: data.bio || '',
          avatar_url: data.avatar_url || '',
          favorite_music: data.favorite_music || '',
          gender: data.gender || '',
          links: data.links ? data.links.join(', ') : ''
        });
      }
    } catch (error) {
      console.error('Erro ao carregar perfil:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const linksArray = formData.links.split(',').map(link => link.trim()).filter(link => link !== '');
      
      const { error } = await supabase
        .from('profiles')
        .upsert({
          id: session?.user.id,
          first_name: formData.first_name,
          username: formData.username,
          bio: formData.bio,
          avatar_url: formData.avatar_url,
          favorite_music: formData.favorite_music,
          gender: formData.gender,
          links: linksArray,
          updated_at: new Date().toISOString()
        });

      if (error) throw error;
      showSuccess('Perfil atualizado com sucesso!');
      navigate('/profile');
    } catch (error) {
      showError('Erro ao salvar perfil.');
      console.error(error);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="min-h-screen bg-[#050505] flex items-center justify-center text-white">Carregando...</div>;
  }

  return (
    <div className="min-h-screen bg-[#050505] text-white pb-10">
      <header className="px-6 py-6 flex items-center justify-between border-b border-white/5 sticky top-0 bg-black/80 backdrop-blur-md z-50">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="p-2 hover:bg-white/5 rounded-full transition-colors">
            <ChevronLeft size={24} />
          </button>
          <h1 className="text-xl font-bold">Editar Perfil</h1>
        </div>
        <Button 
          onClick={handleSave} 
          disabled={saving}
          className="bg-violet-600 hover:bg-violet-700 text-white rounded-full px-6"
        >
          {saving ? 'Salvando...' : 'Salvar'}
        </Button>
      </header>

      <main className="px-6 py-8 max-w-md mx-auto space-y-8">
        {/* Foto de Perfil */}
        <div className="flex flex-col items-center gap-4">
          <div className="relative group">
            <div className="p-1 rounded-full bg-gradient-to-tr from-violet-600 to-cyan-400">
              <img 
                src={formData.avatar_url || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400"} 
                className="w-32 h-32 rounded-full object-cover border-4 border-black" 
                alt="Profile" 
              />
            </div>
            <button className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
              <Camera size={32} className="text-white" />
            </button>
          </div>
          <p className="text-xs text-gray-500">Toque para alterar a foto</p>
        </div>

        <div className="space-y-6">
          {/* Nome */}
          <div className="space-y-2">
            <Label className="text-gray-400 flex items-center gap-2">
              <User size={14} /> Nome
            </Label>
            <Input 
              value={formData.first_name}
              onChange={(e) => setFormData({...formData, first_name: e.target.value})}
              placeholder="Seu nome"
              className="bg-white/5 border-white/10 rounded-xl focus:ring-violet-500"
            />
          </div>

          {/* Username */}
          <div className="space-y-2">
            <Label className="text-gray-400 flex items-center gap-2">
              @ Nome de usuário
            </Label>
            <Input 
              value={formData.username}
              onChange={(e) => setFormData({...formData, username: e.target.value})}
              placeholder="username"
              className="bg-white/5 border-white/10 rounded-xl focus:ring-violet-500"
            />
          </div>

          {/* Bio */}
          <div className="space-y-2">
            <Label className="text-gray-400 flex items-center gap-2">
              <Info size={14} /> Biografia
            </Label>
            <Textarea 
              value={formData.bio}
              onChange={(e) => setFormData({...formData, bio: e.target.value})}
              placeholder="Conte um pouco sobre você..."
              className="bg-white/5 border-white/10 rounded-xl focus:ring-violet-500 min-h-[100px]"
            />
          </div>

          {/* Gênero */}
          <div className="space-y-2">
            <Label className="text-gray-400">Gênero</Label>
            <Select 
              value={formData.gender} 
              onValueChange={(value) => setFormData({...formData, gender: value})}
            >
              <SelectTrigger className="bg-white/5 border-white/10 rounded-xl">
                <SelectValue placeholder="Selecione seu gênero" />
              </SelectTrigger>
              <SelectContent className="bg-zinc-900 border-white/10 text-white">
                <SelectItem value="masculino">Masculino</SelectItem>
                <SelectItem value="feminino">Feminino</SelectItem>
                <SelectItem value="personalizado">Personalizado</SelectItem>
                <SelectItem value="nao-dizer">Prefiro não dizer</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Música Favorita */}
          <div className="space-y-2">
            <Label className="text-gray-400 flex items-center gap-2">
              <Music size={14} /> Música Preferida
            </Label>
            <Input 
              value={formData.favorite_music}
              onChange={(e) => setFormData({...formData, favorite_music: e.target.value})}
              placeholder="Artista - Música"
              className="bg-white/5 border-white/10 rounded-xl focus:ring-violet-500"
            />
          </div>

          {/* Links */}
          <div className="space-y-2">
            <Label className="text-gray-400 flex items-center gap-2">
              <LinkIcon size={14} /> Links (separe por vírgula)
            </Label>
            <Input 
              value={formData.links}
              onChange={(e) => setFormData({...formData, links: e.target.value})}
              placeholder="https://instagram.com/seu_user, https://github.com/..."
              className="bg-white/5 border-white/10 rounded-xl focus:ring-violet-500"
            />
          </div>
        </div>
      </main>
    </div>
  );
};

export default EditProfile;