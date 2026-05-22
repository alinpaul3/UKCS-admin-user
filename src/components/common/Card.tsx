import React from 'react';
import { cn } from '../../lib/utils';

export const Card = ({ children, className }: { children: React.ReactNode; className?: string }) => {
  return (
    <div className={cn('bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm', className)}>
      {children}
    </div>
  );
};

export const CardHeader = ({ title, subtitle, action }: { title: string; subtitle?: string; action?: React.ReactNode }) => {
  return (
    <div className="px-6 py-4 border-bottom border-slate-100 flex items-center justify-between">
      <div>
        <h3 className="text-lg font-bold text-slate-900">{title}</h3>
        {subtitle && <p className="text-sm text-slate-500">{subtitle}</p>}
      </div>
      {action && <div>{action}</div>}
    </div>
  );
};

export const CardContent = ({ children, className }: { children: React.ReactNode; className?: string }) => {
  return <div className={cn('p-6', className)}>{children}</div>;
};
