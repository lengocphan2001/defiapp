# React Project Structure

This document outlines the organized structure of your React application with TypeScript.

## 📁 Directory Structure

```
src/
├── components/          # Reusable UI components
│   └── common/         # Common components used across the app
│       ├── Button/     # Button component with variants
│       └── Input/      # Input component with validation
├── pages/              # Page-level components
│   └── Home/          # Home page component
├── hooks/              # Custom React hooks
│   ├── useLocalStorage.ts  # Hook for localStorage management
│   └── useApi.ts           # Hook for API calls with loading states
├── services/           # API and external service integrations
│   └── api.ts         # HTTP client and API utilities
├── context/            # React Context for state management
│   └── AppContext.tsx # Global app state (theme, user, etc.)
├── types/              # TypeScript type definitions
│   └── index.ts       # Common interfaces and types
├── utils/              # Utility functions
│   └── index.ts       # Helper functions (formatDate, debounce, etc.)
├── styles/             # Global styles and CSS
│   └── global.css     # Global CSS reset and utilities
└── assets/             # Static assets
    ├── images/         # Image files
    └── icons/          # Icon files
```

## 🏗️ Architecture Overview

### Components
- **Common Components**: Reusable UI elements like Button, Input
- **Page Components**: Full-page components that represent routes
- **Component Structure**: Each component has its own folder with:
  - Component file (`.tsx`)
  - Styles file (`.css`)
  - Index file for clean imports

### State Management
- **Context API**: Used for global state (theme, user authentication)
- **Local State**: Component-specific state using React hooks
- **Custom Hooks**: Reusable logic for common patterns

### API Layer
- **Service Layer**: Centralized API calls with error handling
- **Custom Hooks**: `useApi` hook for managing API state (loading, error, data)

### Type Safety
- **TypeScript**: Full type safety throughout the application
- **Shared Types**: Common interfaces in `types/index.ts`
- **Component Props**: Typed props for all components

## 🚀 Getting Started

1. **Install Dependencies**:
   ```bash
   npm install
   ```

2. **Start Development Server**:
   ```bash
   npm start
   ```

3. **Build for Production**:
   ```bash
   npm run build
   ```

## 📝 Best Practices

### File Naming
- Use PascalCase for components: `Button.tsx`
- Use camelCase for utilities: `formatDate.ts`
- Use kebab-case for CSS files: `button-styles.css`

### Import Organization
- Group imports: React, third-party, local
- Use absolute imports for better maintainability
- Export components through index files

### Component Structure
```typescript
// Component file structure
import React from 'react';
import { ComponentProps } from '../../types';
import './Component.css';

const Component: React.FC<ComponentProps> = ({ prop1, prop2 }) => {
  // Component logic here
  return (
    <div className="component">
      {/* JSX */}
    </div>
  );
};

export default Component;
```

### State Management
- Use Context for global state
- Use local state for component-specific data
- Use custom hooks for reusable logic

## 🔧 Available Scripts

- `npm start` - Start development server
- `npm run build` - Build for production
- `npm test` - Run tests
- `npm run eject` - Eject from Create React App

## 📦 Key Features

- ✅ TypeScript support
- ✅ Component-based architecture
- ✅ Custom hooks for reusable logic
- ✅ Context API for state management
- ✅ Responsive design
- ✅ Accessibility features
- ✅ Modern CSS with utility classes
- ✅ API service layer
- ✅ Error handling
- ✅ Loading states

## 🎨 Styling

- Global CSS reset and utilities
- Component-scoped CSS
- Responsive design with CSS Grid and Flexbox
- Dark/light theme support
- Utility classes for common styles

## 🔄 State Flow

1. **Global State**: Managed by Context API
2. **API State**: Managed by custom hooks
3. **Local State**: Managed by useState/useReducer
4. **Persistent State**: Managed by localStorage hooks

This structure provides a solid foundation for scaling your React application while maintaining code quality and developer experience. 