import { useState, useRef } from 'react';
import { motion } from 'motion/react';
import { Mic, MicOff, Upload, X, Loader2 } from 'lucide-react';
import { cn } from './utils';

interface VoiceInputProps {
  onTranscript: (text: string) => void;
  onFileTranscript: (text: string) => void;
  isProcessing: boolean;
}

export function VoiceInput({ onTranscript, onFileTranscript, isProcessing }: VoiceInputProps) {
  const [isListening, setIsListening] = useState(false);
  const [showFileUpload, setShowFileUpload] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  const startListening = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
      alert('Ваш браузер не поддерживает голосовой ввод');
      return;
    }

    recognitionRef.current = new SpeechRecognition();
    recognitionRef.current.lang = 'ru-RU';
    recognitionRef.current.continuous = true;
    recognitionRef.current.interimResults = true;

    let finalTranscript = '';

    recognitionRef.current.onresult = (event) => {
      let interimTranscript = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += transcript + ' ';
        } else {
          interimTranscript += transcript;
        }
      }
    };

    recognitionRef.current.onend = () => {
      if (finalTranscript.trim()) {
        onTranscript(finalTranscript.trim());
      }
      setIsListening(false);
    };

    recognitionRef.current.onerror = (event) => {
      console.error('Speech recognition error:', event.error);
      setIsListening(false);
    };

    recognitionRef.current.start();
    setIsListening(true);
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    setIsListening(false);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setShowFileUpload(false);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('model', 'whisper-large-v3');

    try {
      const response = await fetch('https://api.groq.com/openai/v1/audio/transcriptions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${import.meta.env.VITE_GROQ_API_KEY}`,
        },
        body: formData,
      });

      if (response.ok) {
        const data = await response.json();
        onFileTranscript(data.text);
      } else {
        console.error('Transcription error:', await response.text());
        alert('Ошибка транскрибации');
      }
    } catch (error) {
      console.error('Error uploading file:', error);
      alert('Ошибка загрузки файла');
    }
  };

  return (
    <div className="flex items-center gap-2">
      <input
        ref={fileInputRef}
        type="file"
        accept="audio/*,video/*"
        onChange={handleFileUpload}
        className="hidden"
      />

      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={isListening ? stopListening : startListening}
        disabled={isProcessing}
        className={cn(
          "p-3 rounded-xl transition-all",
          isListening 
            ? "bg-red-500 hover:bg-red-600 text-white" 
            : "bg-indigo-600 hover:bg-indigo-500 text-white",
          isProcessing && "opacity-50 cursor-not-allowed"
        )}
      >
        {isProcessing ? (
          <Loader2 size={20} className="animate-spin" />
        ) : isListening ? (
          <MicOff size={20} />
        ) : (
          <Mic size={20} />
        )}
      </motion.button>

      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => fileInputRef.current?.click()}
        disabled={isProcessing}
        className="p-3 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-all"
      >
        <Upload size={20} />
      </motion.button>
    </div>
  );
}
