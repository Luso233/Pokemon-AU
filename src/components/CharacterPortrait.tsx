import React from 'react';
import type { CharacterId } from '../types/game';

export const CHARACTER_META: Record<
  CharacterId,
  {
    name: string;
    role: string;
    spriteUrl: string;
    bustUrl: string;
    accentBorder: string;
    accentGlow: string;
  }
> = {
  prince: {
    name: 'Príncipe Heredero',
    role: 'Heredero de la Corona de Galar',
    spriteUrl: '/characters/prince_sprite.png',
    bustUrl: '/characters/prince_bust.png',
    accentBorder: 'border-amber-400/55',
    accentGlow: 'drop-shadow-[0_12px_24px_rgba(251,191,36,0.22)]',
  },
  assassin: {
    name: 'Asesino Carmesí',
    role: 'Cazador de la Corona',
    spriteUrl: '/characters/assassin_sprite.png',
    bustUrl: '/characters/assassin_bust.png',
    accentBorder: 'border-rose-500/55',
    accentGlow: 'drop-shadow-[0_12px_24px_rgba(244,63,94,0.28)]',
  },
};

interface CharacterPortraitProps {
  charId: CharacterId;
  variant?: 'sprite' | 'bust';
  className?: string;
  flipHorizontal?: boolean;
}

export const CharacterPortrait: React.FC<CharacterPortraitProps> = ({
  charId,
  variant = 'sprite',
  className = '',
  flipHorizontal = false,
}) => {
  const meta = CHARACTER_META[charId];
  const src = variant === 'bust' ? meta.bustUrl : meta.spriteUrl;

  return (
    <img
      src={src}
      alt={meta.name}
      draggable={false}
      className={`select-none object-contain ${meta.accentGlow} ${
        flipHorizontal ? '-scale-x-100' : ''
      } ${className}`}
    />
  );
};
