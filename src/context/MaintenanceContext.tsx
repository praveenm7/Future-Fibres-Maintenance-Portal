import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Machine, MaintenanceAction, NonConformity, NCComment, SparePart, AuthorizationMatrix, ListOption } from '@/types/maintenance';
import {
  machines as initialMachines,
  maintenanceActions as initialActions,
  nonConformities as initialNCs,
  ncComments as initialComments,
  spareParts as initialParts
} from '@/data/mockData';
import { toast } from 'sonner';

interface MaintenanceContextType {
  machines: Machine[];
  addMachine: (machine: Machine) => void;
  updateMachine: (machine: Machine) => void;
  deleteMachine: (id: string) => void;

  maintenanceActions: MaintenanceAction[];
  addMaintenanceAction: (action: MaintenanceAction) => void;
  updateMaintenanceAction: (action: MaintenanceAction) => void;
  deleteMaintenanceAction: (id: string) => void;

  nonConformities: NonConformity[];
  addNonConformity: (nc: NonConformity) => void;
  updateNonConformity: (nc: NonConformity) => void;
  deleteNonConformity: (id: string) => void;

  ncComments: NCComment[];
  addNCComment: (comment: NCComment) => void;
  updateNCComment: (comment: NCComment) => void;
  deleteNCComment: (id: string) => void;

  spareParts: SparePart[];
  addSparePart: (part: SparePart) => void;
  updateSparePart: (part: SparePart) => void;
  deleteSparePart: (id: string) => void;

  authorizationMatrices: AuthorizationMatrix[];
  addAuthorizationMatrix: (matrix: AuthorizationMatrix) => void;
  updateAuthorizationMatrix: (matrix: AuthorizationMatrix) => void;
  deleteAuthorizationMatrix: (id: string) => void;

  listOptions: ListOption[];
  addListOption: (option: ListOption) => void;
  updateListOption: (option: ListOption) => void;
  deleteListOption: (id: string) => void;
}

const MaintenanceContext = createContext<MaintenanceContextType | undefined>(undefined);

export const useMaintenance = () => {
  const context = useContext(MaintenanceContext);
  if (!context) {
    throw new Error('useMaintenance must be used within a MaintenanceProvider');
  }
  return context;
};

interface MaintenanceProviderProps {
  children: ReactNode;
}

export const MaintenanceProvider: React.FC<MaintenanceProviderProps> = ({ children }) => {
  // --- STATE INITIALIZATION ---
  const [machines, setMachines] = useState<Machine[]>(() => {
    const saved = localStorage.getItem('maintenance_machines');
    return saved ? JSON.parse(saved) : initialMachines;
  });

  const [maintenanceActions, setMaintenanceActions] = useState<MaintenanceAction[]>(() => {
    const saved = localStorage.getItem('maintenance_actions');
    return saved ? JSON.parse(saved) : initialActions;
  });

  const [nonConformities, setNonConformities] = useState<NonConformity[]>(() => {
    const saved = localStorage.getItem('maintenance_ncs');
    return saved ? JSON.parse(saved) : initialNCs;
  });

  const [ncComments, setNcComments] = useState<NCComment[]>(() => {
    const saved = localStorage.getItem('maintenance_nc_comments');
    return saved ? JSON.parse(saved) : initialComments;
  });

  const [spareParts, setSpareParts] = useState<SparePart[]>(() => {
    const saved = localStorage.getItem('maintenance_spare_parts');
    return saved ? JSON.parse(saved) : initialParts;
  });

  const [authorizationMatrices, setAuthorizationMatrices] = useState<AuthorizationMatrix[]>(() => {
    const saved = localStorage.getItem('maintenance_auth_matrix');
    return saved ? JSON.parse(saved) : [];
  });

  const [listOptions, setListOptions] = useState<ListOption[]>(() => {
    const saved = localStorage.getItem('maintenance_list_options');
    return saved ? JSON.parse(saved) : [];
  });

  // --- PERSISTENCE ---
  useEffect(() => { localStorage.setItem('maintenance_machines', JSON.stringify(machines)); }, [machines]);
  useEffect(() => { localStorage.setItem('maintenance_actions', JSON.stringify(maintenanceActions)); }, [maintenanceActions]);
  useEffect(() => { localStorage.setItem('maintenance_ncs', JSON.stringify(nonConformities)); }, [nonConformities]);
  useEffect(() => { localStorage.setItem('maintenance_nc_comments', JSON.stringify(ncComments)); }, [ncComments]);
  useEffect(() => { localStorage.setItem('maintenance_spare_parts', JSON.stringify(spareParts)); }, [spareParts]);
  useEffect(() => { localStorage.setItem('maintenance_auth_matrix', JSON.stringify(authorizationMatrices)); }, [authorizationMatrices]);
  useEffect(() => { localStorage.setItem('maintenance_list_options', JSON.stringify(listOptions)); }, [listOptions]);

  // --- CRUD HELPERS ---
  const createCrudHandlers = <T extends { id: string }>(
    stateSetter: React.Dispatch<React.SetStateAction<T[]>>,
    name: string
  ) => ({
    add: (item: T) => {
      stateSetter((prev) => [...prev, item]);
      toast.success(`${name} added successfully`);
    },
    update: (item: T) => {
      stateSetter((prev) => prev.map((p) => (p.id === item.id ? item : p)));
      toast.success(`${name} updated successfully`);
    },
    remove: (id: string) => {
      stateSetter((prev) => prev.filter((p) => p.id !== id));
      toast.success(`${name} deleted successfully`);
    }
  });

  const machineOps = createCrudHandlers(setMachines, 'Machine');
  const actionOps = createCrudHandlers(setMaintenanceActions, 'Maintenance Action');
  const ncOps = createCrudHandlers(setNonConformities, 'Non-Conformity');
  const commentOps = createCrudHandlers(setNcComments, 'Comment');
  const partOps = createCrudHandlers(setSpareParts, 'Spare Part');
  const authOps = createCrudHandlers(setAuthorizationMatrices, 'Authorization Record');
  const listOps = createCrudHandlers(setListOptions, 'List Option');

  return (
    <MaintenanceContext.Provider
      value={{
        machines,
        addMachine: machineOps.add,
        updateMachine: machineOps.update,
        deleteMachine: machineOps.remove,

        maintenanceActions,
        addMaintenanceAction: actionOps.add,
        updateMaintenanceAction: actionOps.update,
        deleteMaintenanceAction: actionOps.remove,

        nonConformities,
        addNonConformity: ncOps.add,
        updateNonConformity: ncOps.update,
        deleteNonConformity: ncOps.remove,

        ncComments,
        addNCComment: commentOps.add,
        updateNCComment: commentOps.update,
        deleteNCComment: commentOps.remove,

        spareParts,
        addSparePart: partOps.add,
        updateSparePart: partOps.update,
        deleteSparePart: partOps.remove,

        authorizationMatrices,
        addAuthorizationMatrix: authOps.add,
        updateAuthorizationMatrix: authOps.update,
        deleteAuthorizationMatrix: authOps.remove,

        listOptions,
        addListOption: listOps.add,
        updateListOption: listOps.update,
        deleteListOption: listOps.remove,
      }}
    >
      {children}
    </MaintenanceContext.Provider>
  );
};
