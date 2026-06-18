import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../../atoms';
import { ButtonProps } from '../button/button';

export interface BackButtonProps extends Omit<ButtonProps, 'onClick'> {
  to?: string;
  label?: string;
}

const BackButton: React.FC<BackButtonProps> = ({ 
  to, 
  label = 'Back', 
  variant = 'link', 
  className = '', 
  ...props 
}) => {
  const navigate = useNavigate();

  const handleBack = () => {
    if (to) {
      navigate(to);
    } else {
      navigate(-1);
    }
  };

  return (
    <Button 
      variant={variant} 
      onClick={handleBack} 
      className={`px-0 text-gray-500 hover:text-gray-900 ${className}`}
      {...props}
    >
      <span className="mr-1">&larr;</span> {label}
    </Button>
  );
};

export default BackButton;
