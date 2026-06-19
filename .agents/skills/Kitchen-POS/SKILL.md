```markdown
# Kitchen-POS Development Patterns

> Auto-generated skill from repository analysis

## Overview
This skill teaches you the core development patterns and conventions used in the Kitchen-POS repository, a TypeScript-based POS system. It covers file organization, code style, and the main workflows for adding new features (with backend IPC and frontend integration) and updating the database schema. Use this guide to contribute effectively and maintain consistency across the codebase.

## Coding Conventions

### File Naming
- Use **camelCase** for file names.
  - Example: `orderManager.ts`, `userSettings.tsx`

### Import Style
- Use **relative imports**.
  - Example:
    ```typescript
    import { getOrder } from '../services/orderService';
    ```

### Export Style
- Use **named exports**.
  - Example:
    ```typescript
    // In orderManager.ts
    export function createOrder() { ... }
    export function cancelOrder() { ... }
    ```

### Commit Messages
- Follow **conventional commit** format.
- Use the `feat` prefix for new features.
  - Example: `feat: add kitchen display screen for new orders`

## Workflows

### Add New Feature with IPC and Frontend Integration
**Trigger:** When adding a new core feature that requires backend IPC, type definitions, and frontend UI integration.  
**Command:** `/new-feature-ipc-frontend`

1. **Create backend IPC handler file**
   - Path: `backend/src/ipc/featureName.ts`
   - Example:
     ```typescript
     // backend/src/ipc/orderStatus.ts
     import { ipcMain } from 'electron';
     ipcMain.handle('get-order-status', async (event, orderId) => {
       // logic here
     });
     ```
2. **Update preload bindings**
   - Path: `backend/src/preload.ts`
   - Example:
     ```typescript
     contextBridge.exposeInMainWorld('orderAPI', {
       getOrderStatus: (orderId) => ipcRenderer.invoke('get-order-status', orderId),
     });
     ```
3. **Update main entry if needed**
   - Path: `backend/src/main.ts`
   - Register new handlers or services if required.
4. **Define new types/interfaces**
   - Path: `frontend/src/types/models.ts`
   - Example:
     ```typescript
     export interface OrderStatus {
       id: string;
       status: string;
     }
     ```
5. **Add IPC bindings to frontend**
   - Path: `frontend/src/lib/ipc.ts`
   - Example:
     ```typescript
     export const getOrderStatus = (orderId: string) =>
       window.orderAPI.getOrderStatus(orderId);
     ```
6. **Create React context/hook if stateful**
   - Path: `frontend/src/contexts/OrderStatusContext.tsx`
   - Example:
     ```typescript
     import React, { createContext, useContext, useState } from 'react';
     // context logic here
     ```
7. **Add or update frontend component(s)**
   - Path: `frontend/src/components/organisms/orderStatus/OrderStatusComponent.tsx`
   - Example:
     ```typescript
     export function OrderStatusComponent({ orderId }) {
       // use context/hook and render UI
     }
     ```
8. **Wire provider into app**
   - Path: `frontend/src/app/app.tsx`
   - Example:
     ```typescript
     <OrderStatusProvider>
       <App />
     </OrderStatusProvider>
     ```
9. **Update relevant pages to use new feature**
   - Path: `frontend/src/pages/orders/index.tsx`
   - Integrate the new component/context.

### Add Database Table and Migrate Schema
**Trigger:** When introducing a new table or schema change in the database.  
**Command:** `/new-table`

1. **Create migration SQL file**
   - Path: `backend/src/db/migrations/NNN_feature.sql`
   - Example:
     ```sql
     CREATE TABLE kitchen_station (
       id SERIAL PRIMARY KEY,
       name TEXT NOT NULL
     );
     ```
2. **Update backend logic to use new table/column**
   - Paths: 
     - `backend/src/ipc/*.ts`
     - `backend/src/services/*.ts`
   - Example:
     ```typescript
     // backend/src/services/kitchenStationService.ts
     export async function addKitchenStation(name: string) { ... }
     ```

## Testing Patterns

- **Test files** follow the pattern: `*.test.*`
  - Example: `orderManager.test.ts`
- **Testing framework:** Not explicitly detected; check existing test files for conventions.
- Place test files alongside the modules they test or in a dedicated `__tests__` directory.

## Commands

| Command                   | Purpose                                                         |
|---------------------------|-----------------------------------------------------------------|
| /new-feature-ipc-frontend | Scaffold a new feature with backend IPC and frontend integration|
| /new-table                | Add a new database table and update backend logic               |
```
