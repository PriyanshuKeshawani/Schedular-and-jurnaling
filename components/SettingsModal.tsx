import React, { useState, useRef, useEffect } from 'react';
import { UIPreference, BackgroundEffectType, TranslationDictionary } from '../types';
import { GlassCard } from './GlassCard';
import { X, Save, Palette, Image as ImageIcon, Zap, Droplet, Upload, Film, Sparkles, Wind, Sun, Bell, Globe, Play, Square } from 'lucide-react';

interface SettingsModalProps {
  config: UIPreference;
  onSave: (newConfig: UIPreference) => void;
  onCancel: () => void;
  t: TranslationDictionary;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ config, onSave, onCancel, t }) => {
  const [formData, setFormData] = useState<UIPreference>({ ...config });
  const [isPlaying, setIsPlaying] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const audioInputRef = useRef<HTMLInputElement>(null);
  const previewAudioRef = useRef<HTMLAudioElement | null>(null);

  // Cleanup audio on unmount
  useEffect(() => {
    return () => {
      if (previewAudioRef.current) {
        previewAudioRef.current.pause();
        previewAudioRef.current = null;
      }
    };
  }, []);

  const handleChange = (field: keyof UIPreference, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
        alert("Warning: Large files might not persist after reload due to browser storage limits.");
    }

    const isVideo = file.type.startsWith('video/');
    const reader = new FileReader();

    reader.onload = (event) => {
        const result = event.target?.result as string;
        setFormData(prev => ({
            ...prev,
            backgroundImage: result,
            backgroundType: isVideo ? 'video' : 'image'
        }));
    };

    reader.readAsDataURL(file);
  };

  const handleAudioUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    // Limit audio size strictly for localStorage
    if (file.size > 10 * 1024 * 1024) {
        alert("Audio file too large. Please use a file smaller than 10MB.");
        return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
        const result = event.target?.result as string;
        // Stop current preview if playing
        if (isPlaying && previewAudioRef.current) {
            previewAudioRef.current.pause();
            setIsPlaying(false);
        }

        setFormData(prev => ({
            ...prev,
            defaultAlarmSound: result,
            defaultAlarmSoundName: file.name
        }));
    };
    reader.readAsDataURL(file);
  };

  const togglePreview = () => {
    if (isPlaying) {
        if (previewAudioRef.current) {
            previewAudioRef.current.pause();
            previewAudioRef.current.currentTime = 0;
        }
        setIsPlaying(false);
    } else {
        if (!formData.defaultAlarmSound) return;

        if (!previewAudioRef.current) {
            previewAudioRef.current = new Audio(formData.defaultAlarmSound);
            previewAudioRef.current.onended = () => setIsPlaying(false);
        } else {
            previewAudioRef.current.src = formData.defaultAlarmSound;
        }
        previewAudioRef.current.play().catch(e => console.error("Error playing preview:", e));
        setIsPlaying(true);
    }
  };

  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      const val = e.target.value;
      handleChange('backgroundImage', val);
      
      // Auto-detect type based on extension
      const videoExts = ['.mp4', '.webm', '.ogg', '.mov'];
      const imageExts = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg'];
      
      if (videoExts.some(ext => val.toLowerCase().endsWith(ext))) {
          handleChange('backgroundType', 'video');
      } else if (imageExts.some(ext => val.toLowerCase().endsWith(ext))) {
          handleChange('backgroundType', 'image');
      }
  };

  const effects: { id: BackgroundEffectType; label: string }[] = [
      { id: 'none', label: 'None' },
      { id: 'snow', label: 'Snowfall' },
      { id: 'rain', label: 'Rain' },
      { id: 'embers', label: 'Fire Embers' },
      { id: 'matrix', label: 'Digital Rain' },
      { id: 'breathe', label: 'Zen Pulse' }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <GlassCard className="w-full max-w-lg overflow-y-auto !bg-[#1a1a1a]/90 border-glass-border shadow-2xl max-h-[90vh]">
        <div className="flex justify-between items-center mb-6 border-b border-white/10 pb-4">
          <div className="flex items-center gap-2">
            <Palette className="text-accent-400" size={20} />
            <h2 className="text-xl font-bold text-white">{t.uiCustomization}</h2>
          </div>
          <button onClick={onCancel} className="p-1 hover:bg-white/10 rounded-full transition-colors">
            <X size={20} className="text-white/70" />
          </button>
        </div>

        <div className="space-y-6">
          
          <div className="grid grid-cols-2 gap-4">
              {/* Theme Name */}
              <div>
                 <label className="block text-xs font-medium text-white/60 mb-1.5 uppercase tracking-wider">{t.themeName}</label>
                 <input 
                   type="text" 
                   value={formData.themeName}
                   onChange={(e) => handleChange('themeName', e.target.value)}
                   className="w-full glass-input rounded-lg p-3 text-white focus:outline-none focus:border-accent-500 transition-colors"
                 />
              </div>

               {/* Language Setting */}
               <div>
                 <label className="block text-xs font-medium text-white/60 mb-1.5 uppercase tracking-wider flex items-center gap-2">
                    <Globe size={14} /> {t.aiLanguage}
                 </label>
                 <input 
                   type="text" 
                   value={formData.language || ''}
                   onChange={(e) => handleChange('language', e.target.value)}
                   placeholder="e.g. English, Hinglish, Español"
                   className="w-full glass-input rounded-lg p-3 text-white focus:outline-none focus:border-accent-500 transition-colors"
                 />
              </div>
          </div>

          {/* Background Selection */}
          <div>
            <div className="flex justify-between items-end mb-2">
                <label className="text-xs font-medium text-white/60 uppercase tracking-wider flex items-center gap-2">
                   <ImageIcon size={14} /> {t.backgroundMedia}
                </label>
                <div className="flex bg-white/5 rounded-lg p-0.5 border border-white/10">
                    <button 
                        onClick={() => handleChange('backgroundType', 'image')}
                        className={`px-3 py-1 text-[10px] font-medium rounded-md transition-all ${formData.backgroundType === 'image' ? 'bg-accent-500 text-white shadow-sm' : 'text-white/50 hover:text-white hover:bg-white/5'}`}
                    >
                        Image
                    </button>
                    <button 
                        onClick={() => handleChange('backgroundType', 'video')}
                        className={`px-3 py-1 text-[10px] font-medium rounded-md transition-all ${formData.backgroundType === 'video' ? 'bg-accent-500 text-white shadow-sm' : 'text-white/50 hover:text-white hover:bg-white/5'}`}
                    >
                        Video
                    </button>
                </div>
            </div>
            
            <div className="flex flex-col gap-3">
                {/* URL Input */}
                <div className="flex gap-2">
                    <input 
                        type="text" 
                        value={formData.backgroundImage.startsWith('data:') ? '(Local File Loaded)' : formData.backgroundImage}
                        onChange={handleUrlChange}
                        className="flex-1 glass-input rounded-lg p-3 text-white focus:outline-none focus:border-accent-500 text-sm font-mono truncate"
                        placeholder="Paste URL (Image or Video)..."
                    />
                    
                    <input 
                        type="file" 
                        ref={fileInputRef}
                        className="hidden"
                        accept="image/*,video/*"
                        onChange={handleFileUpload}
                    />
                    
                    <button 
                        onClick={() => fileInputRef.current?.click()}
                        className="bg-white/10 hover:bg-white/20 text-white p-3 rounded-lg transition-colors flex items-center gap-2 whitespace-nowrap"
                        title="Upload Local File"
                    >
                        <Upload size={18} />
                    </button>
                </div>

                {/* Preview Area */}
                <div className="w-full h-32 rounded-lg border border-white/10 bg-black/50 overflow-hidden relative group">
                    {formData.backgroundType === 'video' ? (
                        <video 
                            src={formData.backgroundImage} 
                            className="w-full h-full object-cover opacity-80"
                            autoPlay loop muted 
                            playsInline
                            key={formData.backgroundImage} // Force remount on src change
                            onError={() => console.log("Video failed to load")}
                        />
                    ) : (
                        <div 
                            className="w-full h-full bg-cover bg-center opacity-80"
                            style={{ backgroundImage: `url(${formData.backgroundImage})` }}
                        />
                    )}
                    <div className="absolute top-2 right-2 pointer-events-none">
                         <span className="bg-black/60 px-2 py-1 rounded text-[10px] text-white/80 backdrop-blur-md uppercase tracking-wide border border-white/10 flex items-center gap-1">
                            {formData.backgroundType === 'video' ? <><Film size={10}/> Video Mode</> : <><ImageIcon size={10}/> Image Mode</>}
                         </span>
                    </div>
                </div>
            </div>
          </div>

          {/* Alarm Settings */}
          <div>
             <label className="block text-xs font-medium text-white/60 mb-1.5 uppercase tracking-wider flex items-center gap-2">
                 <Bell size={14} /> {t.defaultAlarm}
             </label>
             <div className="flex items-center gap-2">
                 <input 
                   type="file" 
                   ref={audioInputRef}
                   className="hidden"
                   accept="audio/*"
                   onChange={handleAudioUpload}
                 />
                 <button 
                   onClick={() => audioInputRef.current?.click()}
                   className="flex-1 glass-input p-2 rounded-lg text-sm text-left text-white/70 hover:text-white transition-colors flex items-center justify-between min-w-0"
                 >
                   <span className="truncate pr-2">
                    {formData.defaultAlarmSoundName ? formData.defaultAlarmSoundName : (formData.defaultAlarmSound ? 'Custom Tone Loaded' : 'System Default Alert')}
                   </span>
                   <Upload size={14} className="opacity-50 flex-shrink-0" />
                 </button>

                 {/* Play/Stop Preview */}
                 {formData.defaultAlarmSound && (
                    <button
                        onClick={togglePreview}
                        className={`p-2 rounded-lg transition-colors flex-shrink-0 ${isPlaying ? 'bg-red-500/20 text-red-400 hover:bg-red-500/30' : 'bg-green-500/20 text-green-400 hover:bg-green-500/30'}`}
                        title={isPlaying ? "Stop Preview" : "Play Preview"}
                    >
                        {isPlaying ? <Square size={16} fill="currentColor" /> : <Play size={16} fill="currentColor" />}
                    </button>
                 )}

                 {formData.defaultAlarmSound && (
                     <button 
                       onClick={() => {
                        if (isPlaying && previewAudioRef.current) {
                            previewAudioRef.current.pause();
                            setIsPlaying(false);
                        }
                        setFormData(prev => ({...prev, defaultAlarmSound: undefined, defaultAlarmSoundName: undefined}));
                       }}
                       className="p-2 hover:bg-white/10 rounded-lg text-white/50 hover:text-red-400 transition-colors flex-shrink-0"
                       title="Reset to System Default"
                     >
                         <X size={16} />
                     </button>
                 )}
             </div>
          </div>

          {/* Atmospheric Effects */}
          <div>
               <label className="block text-xs font-medium text-white/60 mb-1.5 uppercase tracking-wider flex items-center gap-2">
                 <Wind size={14} /> {t.atmosphericEffect}
               </label>
               <div className="grid grid-cols-3 gap-2">
                  {effects.map((fx) => (
                      <button
                        key={fx.id}
                        onClick={() => handleChange('backgroundEffect', fx.id)}
                        className={`
                           p-2 rounded-lg text-sm border transition-all
                           ${formData.backgroundEffect === fx.id 
                             ? 'bg-accent-500 border-accent-400 text-white shadow-lg' 
                             : 'glass-input text-white/60 hover:text-white'}
                        `}
                      >
                          {fx.label}
                      </button>
                  ))}
               </div>
          </div>

          <div className="grid grid-cols-2 gap-6">
             {/* Blur Intensity */}
             <div>
                <label className="block text-xs font-medium text-white/60 mb-3 uppercase tracking-wider flex items-center gap-2">
                   <Droplet size={14} /> {t.blur} ({formData.blurIntensity}px)
                </label>
                <input 
                  type="range" 
                  min="0" 
                  max="50" 
                  value={formData.blurIntensity}
                  onChange={(e) => handleChange('blurIntensity', parseInt(e.target.value))}
                  className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer accent-accent-500"
                />
             </div>

             {/* Transparency */}
             <div>
                <label className="block text-xs font-medium text-white/60 mb-3 uppercase tracking-wider flex items-center gap-2">
                   <Droplet size={14} /> {t.opacity} ({Math.round(formData.transparency * 100)}%)
                </label>
                <input 
                  type="range" 
                  min="0" 
                  max="1" 
                  step="0.05"
                  value={formData.transparency}
                  onChange={(e) => handleChange('transparency', parseFloat(e.target.value))}
                  className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer accent-accent-500"
                />
             </div>
          </div>

          {/* Brightness Control */}
          <div>
             <label className="block text-xs font-medium text-white/60 mb-3 uppercase tracking-wider flex items-center justify-between">
                <span className="flex items-center gap-2"><Sun size={14} /> {t.brightness}</span>
                <span className="text-accent-400">{formData.backgroundBrightness || 40}%</span>
             </label>
             <div className="flex items-center gap-3">
                 <span className="text-[10px] text-white/40">Dark</span>
                 <input 
                    type="range" 
                    min="0" 
                    max="100" 
                    value={formData.backgroundBrightness || 40}
                    onChange={(e) => handleChange('backgroundBrightness', parseInt(e.target.value))}
                    className="flex-1 h-2 bg-white/10 rounded-lg appearance-none cursor-pointer accent-accent-500"
                 />
                 <span className="text-[10px] text-white/40">Light</span>
             </div>
             <p className="text-[10px] text-white/30 mt-1">Adjusts text contrast for readability.</p>
          </div>

          <div className="grid grid-cols-2 gap-6">
            {/* Accent Color */}
            <div>
               <label className="block text-xs font-medium text-white/60 mb-1.5 uppercase tracking-wider">{t.accentColor}</label>
               <div className="flex items-center gap-3">
                  <input 
                    type="color" 
                    value={formData.accentColor}
                    onChange={(e) => handleChange('accentColor', e.target.value)}
                    className="w-10 h-10 rounded cursor-pointer bg-transparent border-none"
                  />
                  <span className="text-sm font-mono text-white/80">{formData.accentColor}</span>
               </div>
            </div>

            {/* Animation Speed */}
            <div>
               <label className="block text-xs font-medium text-white/60 mb-1.5 uppercase tracking-wider flex items-center gap-2">
                 <Zap size={14} /> {t.motionSpeed}
               </label>
               <select 
                  value={formData.animationSpeed}
                  onChange={(e) => handleChange('animationSpeed', e.target.value)}
                  className="w-full glass-input rounded-lg p-3 text-white focus:outline-none focus:border-accent-500"
                >
                  <option value="slow">Slow (Zen)</option>
                  <option value="normal">Normal</option>
                  <option value="fast">Fast (Productivity)</option>
                </select>
            </div>
          </div>
        </div>

        <div className="mt-8 flex justify-end gap-3 pt-4 border-t border-white/10">
          <button 
            onClick={onCancel}
            className="px-4 py-2 rounded-lg text-white/70 hover:bg-white/10 transition-colors"
          >
            {t.cancel}
          </button>
          <button 
            onClick={() => onSave(formData)}
            className="px-4 py-2 rounded-lg bg-accent-500 hover:bg-accent-600 text-white font-medium flex items-center gap-2 transition-colors shadow-lg shadow-accent-500/20"
          >
            <Save size={18} />
            {t.applyTheme}
          </button>
        </div>
      </GlassCard>
    </div>
  );
};