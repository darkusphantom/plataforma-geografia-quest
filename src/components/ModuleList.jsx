import { ModuleCard } from './ModuleCard';

export function ModuleList({ modules, onModuleClick }) {
  if (!modules || modules.length === 0) return null;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {modules.map((modulo) => (
        <ModuleCard 
          key={modulo.id} 
          modulo={modulo} 
          onClick={() => onModuleClick(modulo.id)} 
        />
      ))}
    </div>
  );
}
