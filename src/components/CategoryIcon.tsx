import React from 'react';
import {
  Briefcase,
  Store,
  Laptop,
  Home,
  TrendingUp,
  Gift,
  PlusCircle,
  ShoppingCart,
  Coffee,
  Utensils,
  Zap,
  Fuel,
  ShoppingBag,
  HeartPulse,
  Landmark,
  MoreHorizontal,
  CircleDollarSign,
  LucideProps,
} from 'lucide-react';

interface CategoryIconProps extends LucideProps {
  name: string;
}

export const CategoryIcon: React.FC<CategoryIconProps> = ({ name, ...props }) => {
  switch (name) {
    case 'Briefcase':
      return <Briefcase {...props} />;
    case 'Store':
      return <Store {...props} />;
    case 'Laptop':
      return <Laptop {...props} />;
    case 'Home':
      return <Home {...props} />;
    case 'TrendingUp':
      return <TrendingUp {...props} />;
    case 'Gift':
      return <Gift {...props} />;
    case 'PlusCircle':
      return <PlusCircle {...props} />;
    case 'ShoppingCart':
      return <ShoppingCart {...props} />;
    case 'Coffee':
      return <Coffee {...props} />;
    case 'Utensils':
      return <Utensils {...props} />;
    case 'Zap':
      return <Zap {...props} />;
    case 'Fuel':
      return <Fuel {...props} />;
    case 'ShoppingBag':
      return <ShoppingBag {...props} />;
    case 'HeartPulse':
      return <HeartPulse {...props} />;
    case 'Landmark':
      return <Landmark {...props} />;
    case 'MoreHorizontal':
    default:
      return <MoreHorizontal {...props} />;
  }
};
