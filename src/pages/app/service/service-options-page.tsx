import { useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { ChevronRight, Plus, RefreshCw, Shuffle, Info } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { RouteFallback } from '@/components/shared/route-fallback'
import { PageHeader } from '@/components/shared/page-header'
import { ConfirmDialog } from '@/components/shared/confirm-dialog'
import {
  useAllServiceOptions,
  useCreateServiceOption,
  useUpdateServiceOption,
  useDeleteServiceOption,
  useReorderServiceOption,
  useSplitSharedBrands,
  type ServiceOptionWithId,
} from '@/hooks/use-service-options'
import { SERVICE_OPTION_SECTIONS, type ServiceOptionType } from '@/config/service-options'
import { OptionRow } from './service-options/option-row'
import { AddOptionForm } from './service-options/add-option-form'
import { cn } from '@/lib/utils'

/** Everything a plain flat section (Cancel Reasons, Customer Items, Device Types, Hold Reasons,
 * Outstanding Reasons, Problems) needs — Brands/Models below reuse the same row/add-form pieces
 * but with their own two-level grouping logic. */
function FlatSection({
  type,
  options,
  addOpen,
  onToggleAdd,
}: {
  type: ServiceOptionType
  options: ServiceOptionWithId[]
  addOpen: boolean
  onToggleAdd: () => void
}) {
  const create = useCreateServiceOption(type)
  const update = useUpdateServiceOption(type)
  const del = useDeleteServiceOption(type)
  const reorder = useReorderServiceOption(type)

  return (
    <div>
      {options.map((opt, i) => (
        <OptionRow
          key={opt.id}
          option={opt}
          index={i}
          canMoveUp={i > 0}
          canMoveDown={i < options.length - 1}
          onMove={(direction) => reorder.mutate({ currentList: options, id: opt.id, direction })}
          onRename={(label) => update.mutate({ id: opt.id, label })}
          onDelete={() => del.mutate(opt)}
        />
      ))}
      <div className="pl-6">
        {addOpen ? (
          <AddOptionForm
            placeholder={`New ${type === 'deviceTypes' ? 'device type' : 'label'}...`}
            onCancel={onToggleAdd}
            onSubmit={(input) => {
              create.mutate({ ...input, existingCount: options.length })
              onToggleAdd()
            }}
          />
        ) : (
          <button
            type="button"
            onClick={onToggleAdd}
            className="flex items-center gap-1.5 py-2 text-sm text-teal-700 hover:underline dark:text-teal-400"
          >
            <Plus className="size-3.5" />
            {SERVICE_OPTION_SECTIONS.find((s) => s.type === type)?.addLabel}
          </button>
        )}
      </div>
    </div>
  )
}

function BrandsSection({
  brands,
  deviceTypes,
  addingScope,
  setAddingScope,
}: {
  brands: ServiceOptionWithId[]
  deviceTypes: ServiceOptionWithId[]
  addingScope: string | null
  setAddingScope: (v: string | null) => void
}) {
  const create = useCreateServiceOption('brands')
  const update = useUpdateServiceOption('brands')
  const del = useDeleteServiceOption('brands')
  const reorder = useReorderServiceOption('brands')
  const [openGroups, setOpenGroups] = useState<Set<string>>(new Set())

  function toggleGroup(id: string) {
    setOpenGroups((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  return (
    <div>
      {deviceTypes.map((dt) => {
        const brandsForType = brands
          .filter((b) => b.deviceTypeIds?.includes(dt.id))
          .sort((a, b) => a.order - b.order)
        const isOpen = openGroups.has(dt.id)
        return (
          <div key={dt.id} className="border-b pl-6 last:border-0">
            <div className="flex items-center gap-2 py-2">
              <button
                type="button"
                onClick={() => toggleGroup(dt.id)}
                className="flex flex-1 items-center gap-2 text-left text-sm font-medium"
              >
                <ChevronRight className={cn('size-3.5 text-muted-foreground transition-transform', isOpen && 'rotate-90')} />
                {dt.label}
              </button>
              <span className="rounded-full bg-secondary px-2 py-0.5 text-xs text-secondary-foreground">
                {brandsForType.length}
              </span>
            </div>
            {isOpen && (
              <div className="pb-2">
                {brandsForType.map((brand, i) => (
                  <OptionRow
                    key={brand.id}
                    option={brand}
                    index={i}
                    canMoveUp={i > 0}
                    canMoveDown={i < brandsForType.length - 1}
                    onMove={(direction) => reorder.mutate({ currentList: brandsForType, id: brand.id, direction })}
                    onRename={(label) => update.mutate({ id: brand.id, label })}
                    onDelete={() => del.mutate(brand)}
                  />
                ))}
                <div className="pl-6">
                  {addingScope === dt.id ? (
                    <AddOptionForm
                      placeholder="New brand..."
                      deviceTypeOptions={deviceTypes}
                      defaultScopeId={dt.id}
                      onCancel={() => setAddingScope(null)}
                      onSubmit={(input) => {
                        create.mutate({ ...input, existingCount: brands.length })
                        setAddingScope(null)
                      }}
                    />
                  ) : (
                    <button
                      type="button"
                      onClick={() => setAddingScope(dt.id)}
                      className="flex items-center gap-1.5 py-2 text-sm text-teal-700 hover:underline dark:text-teal-400"
                    >
                      <Plus className="size-3.5" />
                      Add brand
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>
        )
      })}
      <div className="pl-6">
        {addingScope === '__brand_global__' ? (
          <AddOptionForm
            placeholder="New brand..."
            deviceTypeOptions={deviceTypes}
            onCancel={() => setAddingScope(null)}
            onSubmit={(input) => {
              create.mutate({ ...input, existingCount: brands.length })
              setAddingScope(null)
            }}
          />
        ) : (
          <button
            type="button"
            onClick={() => setAddingScope('__brand_global__')}
            className="flex items-center gap-1.5 py-2 text-sm text-teal-700 hover:underline dark:text-teal-400"
          >
            <Plus className="size-3.5" />
            Add brand
          </button>
        )}
      </div>
    </div>
  )
}

function ModelsSection({
  models,
  brands,
  addingScope,
  setAddingScope,
}: {
  models: ServiceOptionWithId[]
  brands: ServiceOptionWithId[]
  addingScope: string | null
  setAddingScope: (v: string | null) => void
}) {
  const create = useCreateServiceOption('models')
  const update = useUpdateServiceOption('models')
  const del = useDeleteServiceOption('models')
  const reorder = useReorderServiceOption('models')
  const [openGroups, setOpenGroups] = useState<Set<string>>(new Set())

  const brandsWithModels = brands.filter((b) => models.some((m) => m.brandId === b.id))

  function toggleGroup(id: string) {
    setOpenGroups((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  return (
    <div>
      {brandsWithModels.map((brand) => {
        const modelsForBrand = models.filter((m) => m.brandId === brand.id).sort((a, b) => a.order - b.order)
        const isOpen = openGroups.has(brand.id)
        return (
          <div key={brand.id} className="border-b pl-6 last:border-0">
            <div className="flex items-center gap-2 py-2">
              <button
                type="button"
                onClick={() => toggleGroup(brand.id)}
                className="flex flex-1 items-center gap-2 text-left text-sm font-medium"
              >
                <ChevronRight className={cn('size-3.5 text-muted-foreground transition-transform', isOpen && 'rotate-90')} />
                {brand.label}
              </button>
              <span className="rounded-full bg-secondary px-2 py-0.5 text-xs text-secondary-foreground">
                {modelsForBrand.length}
              </span>
            </div>
            {isOpen && (
              <div className="pb-2">
                {modelsForBrand.map((model, i) => (
                  <OptionRow
                    key={model.id}
                    option={model}
                    index={i}
                    canMoveUp={i > 0}
                    canMoveDown={i < modelsForBrand.length - 1}
                    onMove={(direction) => reorder.mutate({ currentList: modelsForBrand, id: model.id, direction })}
                    onRename={(label) => update.mutate({ id: model.id, label })}
                    onDelete={() => del.mutate(model)}
                  />
                ))}
              </div>
            )}
          </div>
        )
      })}
      <div className="pl-6">
        {addingScope === '__model_global__' ? (
          <AddOptionForm
            placeholder="New model..."
            brandOptions={brands}
            onCancel={() => setAddingScope(null)}
            onSubmit={(input) => {
              create.mutate({ ...input, existingCount: models.length })
              setAddingScope(null)
            }}
          />
        ) : (
          <button
            type="button"
            onClick={() => setAddingScope('__model_global__')}
            className="flex items-center gap-1.5 py-2 text-sm text-teal-700 hover:underline dark:text-teal-400"
          >
            <Plus className="size-3.5" />
            Add model
          </button>
        )}
      </div>
    </div>
  )
}

export function ServiceOptionsPage() {
  const { data, isLoading } = useAllServiceOptions()
  const splitSharedBrands = useSplitSharedBrands()
  const queryClient = useQueryClient()
  const [openSections, setOpenSections] = useState<Set<ServiceOptionType>>(new Set(['brands']))
  const [addingIn, setAddingIn] = useState<string | null>(null)
  const [confirmingSplit, setConfirmingSplit] = useState(false)

  if (isLoading) return <RouteFallback />

  const sharedBrandCount = data.brands.filter((b) => (b.deviceTypeIds?.length ?? 0) > 1).length

  function toggleSection(type: ServiceOptionType) {
    setOpenSections((prev) => {
      const next = new Set(prev)
      if (next.has(type)) next.delete(type)
      else next.add(type)
      return next
    })
  }

  return (
    <div className="space-y-4 p-4 sm:p-6">
      <PageHeader
        title="Service Options"
        subtitle="Manage device types, brands, and problem tags used in job cards"
        actions={
          <>
            <Button
              type="button"
              variant="outline"
              onClick={() => queryClient.invalidateQueries({ queryKey: ['serviceOptions'] })}
            >
              <RefreshCw className="size-4" />
              Refresh
            </Button>
            <Button
              type="button"
              onClick={() => setConfirmingSplit(true)}
              disabled={sharedBrandCount === 0 || splitSharedBrands.isPending}
            >
              <Shuffle className="size-4" />
              Split shared brands
            </Button>
          </>
        }
      />

      {sharedBrandCount > 0 && (
        <p className="flex items-start gap-2 rounded-lg bg-amber-50 p-3 text-sm text-amber-800 dark:bg-amber-500/10 dark:text-amber-400">
          <Info className="mt-0.5 size-4 shrink-0" />
          Some brands are still shared across multiple device types. Click{' '}
          <strong>Split shared brands</strong> above to give each device type its own independent
          brand row. Existing job cards stay untouched.
        </p>
      )}

      <div className="rounded-lg border">
        {SERVICE_OPTION_SECTIONS.map((section) => {
          const options = data[section.type]
          const isOpen = openSections.has(section.type)
          return (
            <Collapsible key={section.type} open={isOpen} onOpenChange={() => toggleSection(section.type)}>
              <div className="border-b last:border-0">
                <CollapsibleTrigger className="flex w-full items-center gap-2 p-3 text-left">
                  <ChevronRight className={cn('size-4 text-muted-foreground transition-transform', isOpen && 'rotate-90')} />
                  <span className="font-medium">{section.label}</span>
                  {section.type === 'brands' && (
                    <span className="flex items-center gap-1 rounded-full bg-purple-100 px-2 py-0.5 text-xs text-purple-700 dark:bg-purple-500/15 dark:text-purple-400">
                      🔗 {data.deviceTypes.length} device types
                    </span>
                  )}
                  {section.type === 'models' && (
                    <span className="flex items-center gap-1 rounded-full bg-purple-100 px-2 py-0.5 text-xs text-purple-700 dark:bg-purple-500/15 dark:text-purple-400">
                      🔗 {data.brands.length} brands
                    </span>
                  )}
                  <span className="rounded-full bg-secondary px-2 py-0.5 text-xs text-secondary-foreground">
                    {options.length}
                  </span>
                </CollapsibleTrigger>
              </div>
              <CollapsibleContent>
                <div className="border-b pb-2 last:border-0">
                  {section.type === 'brands' ? (
                    <BrandsSection
                      brands={data.brands}
                      deviceTypes={data.deviceTypes}
                      addingScope={addingIn}
                      setAddingScope={setAddingIn}
                    />
                  ) : section.type === 'models' ? (
                    <ModelsSection
                      models={data.models}
                      brands={data.brands}
                      addingScope={addingIn}
                      setAddingScope={setAddingIn}
                    />
                  ) : (
                    <FlatSection
                      type={section.type}
                      options={options}
                      addOpen={addingIn === section.type}
                      onToggleAdd={() => setAddingIn(addingIn === section.type ? null : section.type)}
                    />
                  )}
                </div>
              </CollapsibleContent>
            </Collapsible>
          )
        })}
      </div>

      <ConfirmDialog
        open={confirmingSplit}
        onOpenChange={setConfirmingSplit}
        title="Split all shared brands?"
        message={`This creates one independent copy of each of the ${sharedBrandCount} shared brand(s) per device type it applies to, and deletes the original shared brand doc. This is a one-way migration — it cannot be undone.`}
        confirmLabel="Split"
        isPending={splitSharedBrands.isPending}
        onConfirm={() => splitSharedBrands.mutate(data.brands, { onSuccess: () => setConfirmingSplit(false) })}
      />
    </div>
  )
}
