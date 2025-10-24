import React from 'react';

interface IActionButtonProps
  extends React.AnchorHTMLAttributes<HTMLAnchorElement> {
  href: string;
  type?: 'primary' | 'secondary';
  target?: string;
  children: React.ReactNode;
  buttonClassName?: string;
}

function ActionButton({
  href,
  type = 'primary',
  target,
  children,
  buttonClassName,
  ...props
}: IActionButtonProps) {
  return (
    <a
      className={`ActionButton ${type}${buttonClassName ? ` ${buttonClassName}` : ''}`}
      rel={target === '_blank' ? 'noopener noreferrer' : undefined}
      href={href}
      target={target}
      role="button"
      {...props}
    >
      {children}
    </a>
  );
}

export default ActionButton;
