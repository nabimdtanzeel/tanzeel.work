import React from 'react';

export function Split({
  text,
  type = 'blur-up',
  start = 0,
}: {
  text: string;
  type?: string;
  start?: number;
}) {
  return (
    <>
      {text.split(' ').map((w, i) => (
        <span
          key={i}
          data-anim={type}
          style={
            {
              '--i': start + i,
              display: 'inline-block',
              marginRight: '.25em',
            } as React.CSSProperties
          }
        >
          {w}
        </span>
      ))}
    </>
  );
}
