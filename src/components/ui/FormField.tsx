import { ReactNode } from 'react';
import { ChevronDown } from 'lucide-react';

interface FormFieldProps {
  label: string;
  children: ReactNode;
  className?: string;
}

export function FormField({ label, children, className = '' }: FormFieldProps) {
  return (
    <div className={`flex border border-border ${className}`}>
      <div className="form-label min-w-[180px] flex items-center">
        {label}
      </div>
      <div className="flex-1 form-input">
        {children}
      </div>
    </div>
  );
}

interface SelectFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
  className?: string;
}

export function SelectField({ label, value, onChange, options, className = '' }: SelectFieldProps) {
  return (
    <div className={`flex border border-border ${className}`}>
      <div className="form-label min-w-[180px] flex items-center">
        {label}
      </div>
      <div className="flex-1 form-input flex items-center gap-2">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="flex-1 bg-transparent border-none focus:outline-none cursor-pointer"
        >
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <ChevronDown className="h-4 w-4 text-primary" />
      </div>
    </div>
  );
}

interface InputFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  placeholder?: string;
  className?: string;
  readOnly?: boolean;
}

export function InputField({ 
  label, 
  value, 
  onChange, 
  type = 'text', 
  placeholder = '',
  className = '',
  readOnly = false
}: InputFieldProps) {
  return (
    <div className={`flex border border-border ${className}`}>
      <div className="form-label min-w-[180px] flex items-center">
        {label}
      </div>
      <div className="flex-1 form-input">
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          readOnly={readOnly}
          className="w-full bg-transparent border-none focus:outline-none"
        />
      </div>
    </div>
  );
}

interface CheckboxFieldProps {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  className?: string;
}

export function CheckboxField({ label, checked, onChange, className = '' }: CheckboxFieldProps) {
  return (
    <div className={`flex border border-border ${className}`}>
      <div className="form-label min-w-[180px] flex items-center">
        {label}
      </div>
      <div className="flex-1 form-input flex items-center gap-2">
        <span className="font-medium">{checked ? 'YES' : 'NO'}</span>
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          className="h-5 w-5 accent-primary cursor-pointer"
        />
      </div>
    </div>
  );
}
