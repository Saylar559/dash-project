import React from "react";

const FILTER_OPERATORS = [
  { value: '=', label: 'равно' },
  { value: '<>', label: '≠' },
  { value: '>', label: '>' },
  { value: '<', label: '<' },
  { value: 'LIKE', label: 'LIKE' },
];

const FiltersPanel = ({
  fields,
  filterValues,
  onUpdate,
}: {
  fields: string[];
  filterValues: Record<string, any>;
  onUpdate: (newValues: Record<string, any>) => void;
}) => {
  if (!fields || fields.length === 0)
    return (
      <div className="dev-card mb-4">
        <div className="text-gray-400 text-xs p-2">
          Нет фильтруемых полей. Выполните SQL, чтобы получить список колонок, затем выберите их выше.
        </div>
      </div>
    );

  return (
    <div className="dev-card mb-4">
      <div className="dev-subtitle">Фильтры (по колонкам):</div>
      <form
        className="flex flex-col gap-3"
        onSubmit={e => e.preventDefault()}
      >
        {fields.map(field => (
          <div key={field} className="flex gap-2 items-center mb-1">
            <span className="font-semibold min-w-[72px]">{field}</span>

            <select
              className="dev-input max-w-[92px]"
              value={filterValues[field]?.op || '='}
              onChange={e => onUpdate({
                ...filterValues,
                [field]: {
                  ...filterValues[field],
                  op: e.target.value,
                }
              })}
            >
              {FILTER_OPERATORS.map(op =>
                <option key={op.value} value={op.value}>{op.label}</option>
              )}
            </select>

            <input
              className="dev-input flex-1"
              value={filterValues[field]?.val ?? ""}
              onChange={e => onUpdate({
                ...filterValues,
                [field]: {
                  ...filterValues[field],
                  val: e.target.value,
                }
              })}
              placeholder="Значение"
              type="text"
              autoComplete="off"
            />

            <button
              className="bg-red-50 text-red-500 rounded px-2 py-1 text-xs ml-2 hover:bg-red-100"
              type="button"
              tabIndex={-1}
              onClick={() => {
                const newFilters = { ...filterValues };
                delete newFilters[field];
                onUpdate(newFilters);
              }}
              title="Сбросить фильтр"
            >✕</button>
          </div>
        ))}
      </form>

      {Object.keys(filterValues).length === 0 && (
        <div className="text-slate-400 text-xs">Нет активных фильтров</div>
      )}
    </div>
  );
};

export default FiltersPanel;