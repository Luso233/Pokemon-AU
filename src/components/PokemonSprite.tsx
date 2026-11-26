import React, { useEffect, useState } from 'react';
import { getPokemonIconCss, getPokemonSprite } from '../engine/pokemonVisuals';

interface PokemonSpriteProps {
  species: string;
  side?: 'p1' | 'p2';
  animated?: boolean;
  shiny?: boolean;
  className?: string;
  alt?: string;
}

export const PokemonSprite: React.FC<PokemonSpriteProps> = ({
  species,
  side = 'p2',
  animated = true,
  shiny = false,
  className = '',
  alt,
}) => {
  const sprite = getPokemonSprite(species, side, animated, shiny);
  const [src, setSrc] = useState(sprite.url);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setSrc(sprite.url);
    setFailed(false);
  }, [sprite.url]);

  if (failed) {
    return (
      <div
        className={`flex items-center justify-center rounded-full border border-amber-400/30 bg-slate-900/80 px-4 py-2 text-xs font-semibold text-amber-200 ${className}`}
      >
        {species}
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt ?? species}
      draggable={false}
      onError={() => {
        if (src !== sprite.fallbackUrl) {
          setSrc(sprite.fallbackUrl);
        } else {
          setFailed(true);
        }
      }}
      className={`pokemon-sprite select-none object-contain ${className}`}
    />
  );
};

export const PokemonIcon: React.FC<{ species: string; className?: string }> = ({
  species,
  className = '',
}) => {
  const style = getPokemonIconCss(species);
  return (
    <span
      title={species}
      aria-label={species}
      style={style}
      className={`shrink-0 ${className}`}
    />
  );
};
