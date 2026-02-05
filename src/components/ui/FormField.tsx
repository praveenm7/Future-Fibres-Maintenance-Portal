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
  disabled?: boolean;
}

export function SelectField({ label, value, onChange, options, className = '', disabled = false }: SelectFieldProps) {
  return (
    <div className={`flex border border-border ${className} ${disabled ? 'opacity-50 pointer-events-none' : ''}`}>
      <div className="form-label min-w-[180px] flex items-center">
        {label}
      </div>
      <div className="flex-1 form-input flex items-center gap-2">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          className="flex-1 bg-transparent border-none focus:outline-none cursor-pointer disabled:cursor-not-allowed"
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
  disabled?: boolean;
  id?: string;
  min?: string;
}

export function InputField({
  label,
  value,
  onChange,
  type = 'text',
  placeholder = '',
  className = '',
  readOnly = false,
  disabled = false,
  id,
  min
}: InputFieldProps) {
  return (
    <div className={`flex border border-border ${className} ${disabled ? 'opacity-50 pointer-events-none' : ''}`}>
      <div className="form-label min-w-[180px] flex items-center">
        {label}
      </div>
      <div className="flex-1 form-input">
        <input
          id={id}
          min={min}
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          readOnly={readOnly}
          disabled={disabled}
          className="w-full bg-transparent border-none focus:outline-none disabled:cursor-not-allowed"
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
  disabled?: boolean;
}

export function CheckboxField({ label, checked, onChange, className = '', disabled = false }: CheckboxFieldProps) {
  return (
    <div className={`flex border border-border ${className} ${disabled ? 'opacity-50 pointer-events-none' : ''}`}>
      <div className="form-label min-w-[180px] flex items-center">
        {label}
      </div>
      <div className="flex-1 form-input flex items-center gap-2">
        <span className="font-medium">{checked ? 'YES' : 'NO'}</span>
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          disabled={disabled}
          className="h-5 w-5 accent-primary cursor-pointer disabled:cursor-not-allowed"
        />
      </div>
    </div>
  );
}
