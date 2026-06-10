import { Sparkles, ShoppingCart } from 'lucide-react';
import Card from '../components/ui/Card';
import Button from '../components/ui/Button';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import { useGet, useAction } from '../hooks/useApi';

const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
const MEALS = ['breakfast', 'lunch', 'dinner'];

export default function Menu() {
  const menu = useGet('menu', '/menu/current');
  const generate = useAction({ url: '/menu/generate', invalidate: ['menu'], successMessage: 'Menu generated' });
  const toggle = useAction({ method: 'put', invalidate: ['menu'] });

  if (menu.isLoading) return <div className="flex justify-center py-16"><LoadingSpinner size="lg" /></div>;

  const plan = menu.data;

  return (
    <div className="mx-auto max-w-4xl space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">{plan ? `Week of ${plan.week_start}` : 'No menu for this week yet.'}</p>
        <Button loading={generate.isPending} onClick={() => generate.mutate({ data: {} })}>
          <Sparkles size={15} /> {plan ? 'Regenerate' : 'Generate with Claude'}
        </Button>
      </div>

      {generate.isPending && (
        <Card className="flex items-center justify-center gap-3 py-10 text-sm text-gray-500">
          <LoadingSpinner /> Claude is planning your week…
        </Card>
      )}

      {plan && (
        <>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {DAYS.map((day) => (
              <Card key={day}>
                <h3 className="mb-2 text-sm font-semibold capitalize text-gray-100">{day}</h3>
                <div className="space-y-2 text-sm">
                  {MEALS.map((meal) => (
                    <div key={meal}>
                      <span className="text-[10px] uppercase tracking-wider text-gray-500">{meal}</span>
                      <p className="text-gray-300">{plan.meals?.[day]?.[meal] || '—'}</p>
                    </div>
                  ))}
                </div>
              </Card>
            ))}
          </div>

          <Card>
            <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-gray-100">
              <ShoppingCart size={16} /> Shopping list
            </h3>
            <div className="grid gap-x-6 gap-y-1 sm:grid-cols-2">
              {(plan.shopping_list || []).map((item, i) => (
                <label key={i} className="flex cursor-pointer items-center gap-2 py-1 text-sm">
                  <input type="checkbox" checked={!!item.checked}
                    onChange={(e) => toggle.mutate({ url: `/menu/${plan.id}/shopping`, data: { index: i, checked: e.target.checked } })}
                    className="h-4 w-4 rounded accent-blue-500" />
                  <span className={item.checked ? 'text-gray-600 line-through' : 'text-gray-300'}>
                    {item.item} {item.quantity && <span className="text-gray-500">({item.quantity})</span>}
                  </span>
                </label>
              ))}
            </div>
          </Card>
        </>
      )}
    </div>
  );
}
