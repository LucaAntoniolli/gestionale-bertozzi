import { Injectable } from '@angular/core';
import { AuthService } from './auth.service';

export interface EntityPermissions {
  create?: boolean;
  read?: boolean;
  update?: boolean;
  delete?: boolean;
}

export interface PermissionConfig {
  entity: string;
  actions: string[];
}

@Injectable({
  providedIn: 'root'
})
export class PermissionsService {

  constructor(private authService: AuthService) { }

  /**
   * Verifica i permessi per un'entità specifica
   */
  getEntityPermissions(entity: string): EntityPermissions {
    const actions = ['create', 'read', 'update', 'delete'];
    const permissions: EntityPermissions = {};

    actions.forEach(action => {
      const permissionKey = `${entity}.${action}`;
      permissions[action as keyof EntityPermissions] = this.authService.hasPermission(permissionKey);
    });

    return permissions;
  }

  /**
   * Verifica un singolo permesso per un'entità
   */
  can(entity: string, action: string): boolean {
    return this.authService.hasPermission(`${entity}.${action}`);
  }

  /**
   * Verifica permessi multipli per un'entità (AND)
   */
  canAll(entity: string, actions: string[]): boolean {
    return actions.every(action => this.can(entity, action));
  }

  /**
   * Verifica permessi multipli per un'entità (OR)
   */
  canAny(entity: string, actions: string[]): boolean {
    return actions.some(action => this.can(entity, action));
  }

  /**
   * Crea un helper per un'entità specifica
   */
  createEntityHelper(entity: string) {
    return {
      canCreate: () => this.can(entity, 'create'),
      canRead: () => this.can(entity, 'read'),
      canUpdate: () => this.can(entity, 'update'),
      canDelete: () => this.can(entity, 'delete'),
      canModify: () => this.canAny(entity, ['update', 'delete']),
      canManage: () => this.canAll(entity, ['create', 'update', 'delete']),
      getPermissions: () => this.getEntityPermissions(entity)
    };
  }
}