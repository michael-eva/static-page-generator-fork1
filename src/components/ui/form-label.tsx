import React from 'react';
import { cn } from '@/lib/utils';

interface FormLabelProps extends React.LabelHTMLAttributes<HTMLLabelElement> {
    children: React.ReactNode;
    description?: string;
}

const FormLabel = React.forwardRef<HTMLLabelElement, FormLabelProps>(
    ({ className, children, description, ...props }, ref) => {
        return (
            <div className="space-y-2">
                <label
                    ref={ref}
                    className={cn(
                        "block text-base font-semibold leading-6 text-gray-900",
                        className
                    )}
                    {...props}
                >
                    {children}
                </label>
                {description && (
                    <p className="text-sm text-gray-600">
                        {description}
                    </p>
                )}
            </div>
        );
    }
);

FormLabel.displayName = "FormLabel";

export { FormLabel }; 