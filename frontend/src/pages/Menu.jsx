import { useState } from 'react';
import { useGet, useAction } from '../hooks/useApi';
import JIcon from '../components/ui/JIcon.jsx';
import TiltCard from '../components/ui/TiltCard.jsx';

const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
const MEALS = ['breakfast', 'lunch', 'dinner'];

function todayName() {
  return new Date().toLocaleDateString('en', { weekday: 'long' }).toLowerCase();
}

export default function Menu() {
  const menu = useGet('menu', '/api/menu/current');
  const generate = useAction({
    method: 'post',
    url: '/api/menu/generate',
    invalidate: ['menu'],
  });
  const updateShopping = useAction({
    method: 'put',
    url: '/api/menu/__placeholder__/shopping',
    invalidate: ['menu'],
  });

  const [checkedItems, setCheckedItems] = useState({});

  const plan = menu.data;
  const today = todayName();

  const handleGenerateClick = () => {
    generate.mutate({});
  };

  const handleShoppingToggle = (i, checked) => {
    if (!plan) return;
    setCheckedItems((prev) => ({ ...prev, [i]: checked }));
    const updatedList = (plan.shopping_list || []).map((item, idx) =>
      idx === i ? { ...item, checked } : item
    );
    updateShopping.mutate({ _url: `/api/menu/${plan.id}/shopping`, shopping_list: updatedList });
  };

  return (
    <div className="j-screen-col">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <span className="j-sec-title">Weekly Menu</span>
        <button
          className="j-btn j-btn-primary"
          onClick={handleGenerateClick}
          disabled={generate.isPending}
        >
          <JIcon name="sparkles" />
          {generate.isPending ? 'Generating…' : plan ? 'Regenerate' : 'Generate with AI'}
        </button>
      </div>

      {generate.isPending && (
        <div className="j-card j-now" style={{ textAlign: 'center', padding: '2rem', marginBottom: 12 }}>
          <JIcon name="sparkles" />
          <span style={{ marginLeft: 8, opacity: 0.7 }}>Claude is planning your week…</span>
        </div>
      )}

      {!plan && !generate.isPending && (
        <div className="j-card" style={{ textAlign: 'center', padding: '2.5rem 1rem', opacity: 0.6 }}>
          No menu for this week yet. Generate one with AI.
        </div>
      )}

      {plan && (
        <>
          {plan.days && (
            <div className="j-menu-week" style={{ marginBottom: 16 }}>
              {DAYS.map((day) => {
                const dayData = (plan.days || []).find((d) => d.day?.toLowerCase() === day) || {};
                const isToday = day === today;
                return (
                  <TiltCard key={day}>
                    <div className={isToday ? 'j-meal j-meal today' : 'j-meal'}>
                      <div className="j-meal-day">
                        {day.charAt(0).toUpperCase() + day.slice(1)}
                        {isToday && <span className="j-badge" style={{ marginLeft: 6 }}>Today</span>}
                      </div>
                      {MEALS.map((meal) => (
                        <div key={meal} style={{ marginTop: 6 }}>
                          <span className="j-eyebrow">{meal}</span>
                          <div className="j-meal-name">{dayData[meal] || <span style={{ opacity: 0.35 }}>—</span>}</div>
                        </div>
                      ))}
                      {dayData.notes && (
                        <div className="j-meal-note" style={{ marginTop: 8 }}>{dayData.notes}</div>
                      )}
                    </div>
                  </TiltCard>
                );
              })}
            </div>
          )}

          {/* Shopping list */}
          <div className="j-panel">
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
              <JIcon name="shopping-cart" />
              <span className="j-sec-title" style={{ fontSize: 15 }}>Shopping list</span>
            </div>
            {(plan.shopping_list || []).length === 0 ? (
              <div style={{ opacity: 0.5, fontSize: 13 }}>No items yet.</div>
            ) : (
              <div className="j-checklist">
                {(plan.shopping_list || []).map((item, i) => {
                  const checked = checkedItems[i] !== undefined ? checkedItems[i] : !!item.checked;
                  return (
                    <label key={i} className={checked ? 'j-checkitem j-checkitem done' : 'j-checkitem'}>
                      <input
                        type="checkbox"
                        className="j-checkbox"
                        checked={checked}
                        onChange={(e) => handleShoppingToggle(i, e.target.checked)}
                      />
                      <span>
                        {item.item}
                        {item.quantity && (
                          <span style={{ opacity: 0.5, marginLeft: 4 }}>({item.quantity})</span>
                        )}
                      </span>
                    </label>
                  );
                })}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
