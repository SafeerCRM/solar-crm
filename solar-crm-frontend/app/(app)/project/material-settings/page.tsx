'use client';

import { useEffect, useState } from 'react';
import axios from 'axios';

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL;

type MaterialItem = {
  id: number;
  name: string;

  /*
   * Existing technical category.
   */
  category?: string;

  /*
   * Clean dealer-portal grouping.
   */
  dealerCategory?: string;

  /*
   * Applicable mainly to panel materials.
   */
  ratePerWatt?: number;

  /*
 * Generic dealer rate per selected material unit.
 */
dealerUnitRate?: number;

  unit?: string;
  brand?: string;
  rate?: number;
  gstPercent?: number;
  expectedMargin?: number;
  remarks?: string;
  isActive?: boolean;
    hsnCode?: string;
  vendorPreferredName?: string;
  marginType?: 'AMOUNT' | 'PERCENT';
  sellingRate?: number;
  minimumStockLevel?: number;
};

export default function MaterialSettingsPage() {
  const [items, setItems] = useState<
    MaterialItem[]
  >([]);

  const [searchText, setSearchText] = useState('');
const [categoryFilter, setCategoryFilter] = useState('');

const [showHidden, setShowHidden] =
  useState(false);

const [page, setPage] =
  useState(1);

const [limit, setLimit] =
  useState(20);

const [total, setTotal] =
  useState(0);

const [totalPages, setTotalPages] =
  useState(1);

const [categoryOptions, setCategoryOptions] =
  useState<string[]>([]);

  const [loading, setLoading] =
    useState(false);

    const [csvLoading, setCsvLoading] =
  useState(false);

    const [userRoles, setUserRoles] =
  useState<string[]>([]);

    const [editingId, setEditingId] =
  useState<number | null>(null);

  const [form, setForm] = useState({
  name: '',
  category: '',

  dealerCategory: '',
ratePerWatt: '',
dealerUnitRate: '',

unit: '',
    brand: '',
    rate: '',
    gstPercent: '',
    expectedMargin: '',
    remarks: '',
        hsnCode: '',
    vendorPreferredName: '',
    marginType: 'AMOUNT',
    sellingRate: '',
    minimumStockLevel: '',
  });

  const fetchItems = async () => {
  try {
    setLoading(true);

    const token =
      localStorage.getItem('token');

    const res = await axios.get(
      `${API_BASE_URL}/project/material-master`,
      {
        params: {
          page,
          limit,

          search:
            searchText.trim() || undefined,

          category:
            categoryFilter || undefined,

          showHidden:
            showHidden
              ? 'true'
              : 'false',
        },

        headers: token
          ? {
              Authorization: `Bearer ${token}`,
            }
          : {},
      },
    );

    setItems(
      Array.isArray(res.data?.data)
        ? res.data.data
        : [],
    );

    setCategoryOptions(
      Array.isArray(res.data?.categories)
        ? res.data.categories
        : [],
    );

    setTotal(
      Number(
        res.data?.pagination?.total || 0,
      ),
    );

    setTotalPages(
      Math.max(
        Number(
          res.data?.pagination?.totalPages ||
            1,
        ),
        1,
      ),
    );
  } catch (error) {
    console.error(error);
    alert('Failed to load materials');
  } finally {
    setLoading(false);
  }
};

  useEffect(() => {
  try {
    const storedUser =
      localStorage.getItem('user');

    if (storedUser) {
      const parsed =
        JSON.parse(storedUser);

      setUserRoles(
        Array.isArray(parsed?.roles)
          ? parsed.roles
          : [],
      );
    }
  } catch (error) {
    console.error(error);
  }
}, []);

useEffect(() => {
  const timeoutId =
    window.setTimeout(() => {
      fetchItems();
    }, 300);

  return () => {
    window.clearTimeout(timeoutId);
  };
}, [
  page,
  limit,
  searchText,
  categoryFilter,
  showHidden,
]);

  const saveItem = async () => {
  if (!form.name.trim()) {
    alert('Material name required');
    return;
  }

  try {
    const token = localStorage.getItem('token');

    const payload = {
  ...form,

  dealerCategory:
    form.dealerCategory || '',

  ratePerWatt: Number(
    form.ratePerWatt || 0,
  ),

  dealerUnitRate: Number(
  form.dealerUnitRate || 0,
),

  rate: Number(form.rate || 0),
  gstPercent: Number(form.gstPercent || 0),
  expectedMargin: Number(form.expectedMargin || 0),
  sellingRate: Number(form.sellingRate || 0),
  minimumStockLevel: Number(
  form.minimumStockLevel || 0,
),
  marginType:
    form.marginType === 'PERCENT'
      ? 'PERCENT'
      : 'AMOUNT',
};

    if (editingId) {
      await axios.patch(
        `${API_BASE_URL}/project/material-master/${editingId}`,
        payload,
        {
          headers: token
            ? {
                Authorization: `Bearer ${token}`,
              }
            : {},
        },
      );

      alert('Material updated');
    } else {
      await axios.post(
        `${API_BASE_URL}/project/material-master`,
        payload,
        {
          headers: token
            ? {
                Authorization: `Bearer ${token}`,
              }
            : {},
        },
      );

      alert('Material added');
    }

    setForm({
  name: '',
  category: '',

  dealerCategory: '',
  ratePerWatt: '',
dealerUnitRate: '',
  unit: '',
  brand: '',
  hsnCode: '',
  vendorPreferredName: '',
  rate: '',
  gstPercent: '',
  marginType: 'AMOUNT',
  expectedMargin: '',
  sellingRate: '',
  minimumStockLevel: '',
  remarks: '',
});

    setEditingId(null);

    fetchItems();
  } catch (error: any) {
    console.error(error);

    alert(
      error?.response?.data?.message ||
        'Failed to save material',
    );
  }
};

const startEdit = (item: MaterialItem) => {
  setEditingId(item.id);

  setForm({
  name: item.name || '',
  category: item.category || '',

  dealerCategory:
  String(item.dealerCategory || '')
    .trim()
    .toUpperCase() === 'INVERTERS'
    ? 'ONGRID_INVERTERS'
    : item.dealerCategory || '',

  ratePerWatt: String(
  item.ratePerWatt || '',
),

dealerUnitRate: String(
  item.dealerUnitRate ||
    item.ratePerWatt ||
    '',
),

unit: item.unit || '',
  brand: item.brand || '',
  hsnCode: item.hsnCode || '',
  vendorPreferredName: item.vendorPreferredName || '',
  rate: String(item.rate || ''),
  gstPercent: String(item.gstPercent || ''),
  marginType:
    item.marginType === 'PERCENT'
      ? 'PERCENT'
      : 'AMOUNT',
  expectedMargin: String(item.expectedMargin || ''),
  sellingRate: String(item.sellingRate || ''),
minimumStockLevel: String(
  item.minimumStockLevel || '',
),
remarks: item.remarks || '',
});

  window.scrollTo({
    top: 0,
    behavior: 'smooth',
  });
};

const cancelEdit = () => {
  setEditingId(null);

  setForm({
  name: '',
  category: '',

  dealerCategory: '',
  ratePerWatt: '',
  dealerUnitRate: '',

  unit: '',
  brand: '',
  hsnCode: '',
  vendorPreferredName: '',
  rate: '',
  gstPercent: '',
  marginType: 'AMOUNT',
  expectedMargin: '',
  sellingRate: '',
minimumStockLevel: '',
remarks: '',
});
};

  const toggleMaterialStatus = async (
    item: MaterialItem,
  ) => {
    const confirmed =
      window.confirm(
        item.isActive
  ? 'Hide this material?'
  : 'Restore this material?',
      );

    if (!confirmed) {
      return;
    }

    try {
      const token =
        localStorage.getItem('token');

      await axios.patch(
        `${API_BASE_URL}/project/material-master/${item.id}/${
  item.isActive ? 'delete' : 'enable'
}`,
        {},
        {
          headers: token
            ? {
                Authorization: `Bearer ${token}`,
              }
            : {},
        },
      );

      alert(
  item.isActive
  ? 'Material hidden'
  : 'Material restored',
);

      if (
  items.length === 1 &&
  page > 1
) {
  setPage(page - 1);
} else {
  fetchItems();
}
    } catch (error: any) {
      console.error(error);

      alert(
        error?.response?.data?.message ||
          'Failed to update material visibility',
      );
    }
  };

  const canManageMaterials =
  userRoles.includes('OWNER') ||
  userRoles.includes('PROJECT_MANAGER') ||
  userRoles.includes('ACCOUNT_MANAGER') ||
  userRoles.includes('STOCK_MANAGER');

  const canViewMaterials =
  canManageMaterials ||
  userRoles.includes('ACCOUNT_MANAGER') ||
  userRoles.includes('STOCK_MANAGER');


  const filteredItems = items;

const downloadMaterialCsv = async () => {
  try {
    setCsvLoading(true);

    const token =
      localStorage.getItem('token');

    /*
     * First request determines how many
     * matching material pages exist.
     */
    const firstResponse = await axios.get(
      `${API_BASE_URL}/project/material-master`,
      {
        params: {
          page: 1,
          limit: 100,

          search:
            searchText.trim() || undefined,

          category:
            categoryFilter || undefined,

          showHidden:
            showHidden
              ? 'true'
              : 'false',
        },

        headers: token
          ? {
              Authorization: `Bearer ${token}`,
            }
          : {},
      },
    );

    const allItems: MaterialItem[] =
      Array.isArray(firstResponse.data?.data)
        ? [...firstResponse.data.data]
        : [];

    const exportTotalPages = Math.max(
      Number(
        firstResponse.data?.pagination
          ?.totalPages || 1,
      ),
      1,
    );

    /*
     * Load every remaining filtered page.
     * The backend safely limits each request
     * to a maximum of 100 materials.
     */
    if (exportTotalPages > 1) {
      const pageNumbers = Array.from(
        {
          length:
            exportTotalPages - 1,
        },
        (_, index) => index + 2,
      );

      /*
       * Small batches avoid sending too many
       * API requests at the same time.
       */
      const batchSize = 5;

      for (
        let index = 0;
        index < pageNumbers.length;
        index += batchSize
      ) {
        const currentBatch =
          pageNumbers.slice(
            index,
            index + batchSize,
          );

        const responses =
          await Promise.all(
            currentBatch.map(
              (exportPage) =>
                axios.get(
                  `${API_BASE_URL}/project/material-master`,
                  {
                    params: {
                      page: exportPage,
                      limit: 100,

                      search:
                        searchText.trim() ||
                        undefined,

                      category:
                        categoryFilter ||
                        undefined,

                      showHidden:
                        showHidden
                          ? 'true'
                          : 'false',
                    },

                    headers: token
                      ? {
                          Authorization:
                            `Bearer ${token}`,
                        }
                      : {},
                  },
                ),
            ),
          );

        for (const response of responses) {
          if (
            Array.isArray(
              response.data?.data,
            )
          ) {
            allItems.push(
              ...response.data.data,
            );
          }
        }
      }
    }

    if (allItems.length === 0) {
      alert(
        showHidden
          ? 'No hidden materials available to export'
          : 'No visible materials available to export',
      );

      return;
    }

    const rows = allItems.map((item) => {
      const rate = Number(
        item.rate || 0,
      );

      const gstPercent = Number(
        item.gstPercent || 0,
      );

      const purchaseWithGst =
        rate +
        (rate * gstPercent) / 100;

      const sellingWithoutGst =
        Number(
          item.sellingRate &&
            item.sellingRate > 0
            ? item.sellingRate
            : purchaseWithGst +
                (item.marginType ===
                'PERCENT'
                  ? (rate *
                      Number(
                        item.expectedMargin ||
                          0,
                      )) /
                    100
                  : Number(
                      item.expectedMargin ||
                        0,
                    )),
        );

      const sellingWithGst =
        sellingWithoutGst +
        (sellingWithoutGst *
          gstPercent) /
          100;

      return {
  Name: item.name || '',

  'Technical Category':
    item.category || '',

  'Dealer Category':
    item.dealerCategory || '',

  'Rate Per Watt':
    Number(item.ratePerWatt || 0),

    'Dealer Unit Rate':
  Number(
    item.dealerUnitRate ||
      item.ratePerWatt ||
      0,
  ),

  Brand: item.brand || '',
        Unit: item.unit || '',
        HSN: item.hsnCode || '',

        Vendor:
          item.vendorPreferredName ||
          '',

        'Purchase Without GST':
          rate,

        'GST %':
          gstPercent,

        'Purchase With GST':
          purchaseWithGst,

        'Selling Without GST':
          sellingWithoutGst,

        'Selling With GST':
          sellingWithGst,

        'Margin Type':
          item.marginType || '',

        'Expected Margin':
          item.expectedMargin || 0,

        'Minimum Stock Level':
          item.minimumStockLevel || 0,

        Status:
          item.isActive === false
            ? 'Hidden'
            : 'Visible',

        Remarks:
          item.remarks || '',
      };
    });

    const headers = Object.keys(
      rows[0],
    );

    const csv = [
      headers
        .map(
          (header) =>
            `"${String(
              header,
            ).replace(/"/g, '""')}"`,
        )
        .join(','),

      ...rows.map((row: any) =>
        headers
          .map(
            (header) =>
              `"${String(
                row[header] ?? '',
              ).replace(
                /"/g,
                '""',
              )}"`,
          )
          .join(','),
      ),
    ].join('\n');

    /*
     * UTF-8 BOM preserves special characters
     * and ₹ values when opened in Excel.
     */
    const blob = new Blob(
      ['\uFEFF', csv],
      {
        type:
          'text/csv;charset=utf-8;',
      },
    );

    const url =
      URL.createObjectURL(blob);

    const link =
      document.createElement('a');

    link.href = url;

    link.download =
      `${
        showHidden
          ? 'hidden-material-list'
          : 'visible-material-list'
      }-${new Date()
        .toISOString()
        .slice(0, 10)}.csv`;

    document.body.appendChild(
      link,
    );

    link.click();
    link.remove();

    URL.revokeObjectURL(url);
  } catch (error: any) {
    console.error(error);

    alert(
      error?.response?.data?.message ||
        'Failed to download material list',
    );
  } finally {
    setCsvLoading(false);
  }
};

  return (
    <div className="mx-auto max-w-7xl space-y-5">
      <div className="rounded-2xl bg-white p-5 shadow">
        <h1 className="text-2xl font-bold text-gray-800">
          Project Material Settings
        </h1>

        <p className="mt-2 text-sm text-gray-500">
          Manage project material master list
        </p>

        {!canManageMaterials && (
  <div className="mt-4 rounded-xl bg-blue-50 p-4 text-sm text-blue-700">
    You have view-only access to material pricing and trading calculations.
  </div>
)}
      </div>

      {canManageMaterials && (
  <div className="rounded-2xl bg-white p-5 shadow">
        <h2 className="mb-4 text-lg font-bold">
          Add Material
        </h2>

        <div className="grid gap-3 md:grid-cols-3">
          <input
            placeholder="Material Name"
            value={form.name}
            onChange={(e) =>
              setForm({
                ...form,
                name: e.target.value,
              })
            }
            className="rounded-xl border p-3"
          />

          <input
            placeholder="Category"
            value={form.category}
            onChange={(e) =>
              setForm({
                ...form,
                category: e.target.value,
              })
            }
            className="rounded-xl border p-3"
          />

          <select
  value={form.dealerCategory}
  onChange={(e) =>
    setForm({
      ...form,
      dealerCategory: e.target.value,
    })
  }
  className="rounded-xl border p-3"
>
  <option value="">
    Dealer Category — Not Assigned
  </option>

  <option value="PANELS">
    Panels
  </option>

  <option value="ONGRID_INVERTERS">
  Ongrid Inverter
</option>

<option value="HYBRID_INVERTERS">
  Hybrid Inverter
</option>

  <option value="STRUCTURE">
    Structure
  </option>

  <option value="ELECTRICAL">
    Electrical
  </option>

  <option value="BATTERIES">
    Batteries
  </option>

  <option value="OTHER">
  Other
</option>
</select>

{form.dealerCategory && (
  <input
    type="number"
    min="0"
    step="any"
    placeholder={
      form.unit.trim()
        ? `Dealer Rate Per ${form.unit.trim()}`
        : 'Dealer Rate Per Unit'
    }
    value={
      form.dealerUnitRate ||
      (
        form.dealerCategory === 'PANELS'
          ? form.ratePerWatt
          : ''
      )
    }
    onChange={(e) =>
      setForm({
        ...form,

        dealerUnitRate:
          e.target.value,

        /*
         * Preserve the legacy panel field too.
         * Existing dealer APIs/pages using
         * ratePerWatt therefore continue working.
         */
        ratePerWatt:
          form.dealerCategory === 'PANELS'
            ? e.target.value
            : form.ratePerWatt,
      })
    }
    className="rounded-xl border p-3"
  />
)}

          <input
            placeholder="Unit"
            value={form.unit}
            onChange={(e) =>
              setForm({
                ...form,
                unit: e.target.value,
              })
            }
            className="rounded-xl border p-3"
          />

          <input
            placeholder="Brand"
            value={form.brand}
            onChange={(e) =>
              setForm({
                ...form,
                brand: e.target.value,
              })
            }
            className="rounded-xl border p-3"
          />

          <input
  placeholder="HSN Code"
  value={form.hsnCode}
  onChange={(e) =>
    setForm({
      ...form,
      hsnCode: e.target.value,
    })
  }
  className="rounded-xl border p-3"
/>

<input
  placeholder="Preferred Vendor"
  value={form.vendorPreferredName}
  onChange={(e) =>
    setForm({
      ...form,
      vendorPreferredName: e.target.value,
    })
  }
  className="rounded-xl border p-3"
/>

          <input
            type="number"
            placeholder="Rate"
            value={form.rate}
            onChange={(e) =>
              setForm({
                ...form,
                rate: e.target.value,
              })
            }
            className="rounded-xl border p-3"
          />

          <input
            type="number"
            placeholder="GST %"
            value={form.gstPercent}
            onChange={(e) =>
              setForm({
                ...form,
                gstPercent: e.target.value,
              })
            }
            className="rounded-xl border p-3"
          />

          <select
  value={form.marginType}
  onChange={(e) =>
    setForm({
      ...form,
      marginType: e.target.value,
    })
  }
  className="rounded-xl border p-3"
>
  <option value="AMOUNT">Margin Amount</option>
  <option value="PERCENT">Margin Percent</option>
</select>

<input
  type="number"
  placeholder="Selling Rate Override"
  value={form.sellingRate}
  onChange={(e) =>
    setForm({
      ...form,
      sellingRate: e.target.value,
    })
  }
  className="rounded-xl border p-3"
/>

          <input
  type="number"
  placeholder="Expected Margin"
  value={form.expectedMargin}
  onChange={(e) =>
    setForm({
      ...form,
      expectedMargin: e.target.value,
    })
  }
  className="rounded-xl border p-3"
/>

<input
  type="number"
  placeholder="Minimum Stock Level"
  value={form.minimumStockLevel}
  onChange={(e) =>
    setForm({
      ...form,
      minimumStockLevel: e.target.value,
    })
  }
  className="rounded-xl border p-3"
/>
        </div>

        <textarea
          placeholder="Remarks"
          value={form.remarks}
          onChange={(e) =>
            setForm({
              ...form,
              remarks: e.target.value,
            })
          }
          className="mt-3 w-full rounded-xl border p-3"
        />

        <button
          onClick={saveItem}
          className="mt-4 rounded-xl bg-blue-600 px-5 py-3 font-semibold text-white hover:bg-blue-700"
        >
          {editingId ? 'Update Material' : 'Add Material'}
        </button>

        {editingId && (
  <button
    onClick={cancelEdit}
    className="ml-3 mt-4 rounded-xl bg-gray-600 px-5 py-3 font-semibold text-white hover:bg-gray-700"
  >
    Cancel Edit
  </button>
)}
      </div>
      )}

{canViewMaterials && (
      <div className="rounded-2xl bg-white p-5 shadow">
        <h2 className="mb-4 text-lg font-bold">
          Material List
        </h2>

        <button
  type="button"
  onClick={downloadMaterialCsv}
  disabled={csvLoading}
  className="mb-4 rounded-xl bg-green-600 px-5 py-3 font-semibold text-white hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-60"
>
  {csvLoading
    ? 'Preparing CSV...'
    : showHidden
      ? 'Download Hidden Materials CSV'
      : 'Download Visible Materials CSV'}
</button>

        <div className="mb-4 grid gap-3 md:grid-cols-4">
  <input
    placeholder="Search material, brand, HSN or vendor"
    value={searchText}
    onChange={(e) => {
      setSearchText(e.target.value);
      setPage(1);
    }}
    className="rounded-xl border p-3"
  />

  <select
    value={categoryFilter}
    onChange={(e) => {
      setCategoryFilter(e.target.value);
      setPage(1);
    }}
    className="rounded-xl border p-3"
  >
    <option value="">
      All Categories
    </option>

    {categoryOptions.map((category) => (
      <option
        key={category}
        value={category}
      >
        {category}
      </option>
    ))}
  </select>

  <select
    value={showHidden ? 'HIDDEN' : 'VISIBLE'}
    onChange={(e) => {
      setShowHidden(
        e.target.value === 'HIDDEN',
      );

      setCategoryFilter('');
      setPage(1);
    }}
    className="rounded-xl border p-3"
  >
    <option value="VISIBLE">
      Visible Materials
    </option>

    <option value="HIDDEN">
      Hidden Materials
    </option>
  </select>

  <select
    value={limit}
    onChange={(e) => {
      setLimit(
        Number(e.target.value),
      );

      setPage(1);
    }}
    className="rounded-xl border p-3"
  >
    <option value={10}>
      10 per page
    </option>

    <option value={20}>
      20 per page
    </option>

    <option value={50}>
      50 per page
    </option>

    <option value={100}>
      100 per page
    </option>
  </select>
</div>

        {loading ? (
          <p>Loading...</p>
        ) : filteredItems.length === 0 ? (
          <p className="text-sm text-gray-500">
            No materials added yet
          </p>
        ) : (
          <div className="space-y-3">
            {filteredItems.map((item) => (
              <div
                key={item.id}
                className={`rounded-xl border p-4 ${
  item.isActive
    ? 'bg-white'
    : 'bg-gray-100 opacity-70'
}`}
              >
                <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                  <div>
                    <p className="font-bold text-gray-800">
  {item.name}

  <span
    className={`ml-2 rounded-full px-2 py-1 text-xs font-semibold ${
      item.isActive
        ? 'bg-green-100 text-green-700'
        : 'bg-red-100 text-red-700'
    }`}
  >
    {item.isActive ? 'ACTIVE' : 'DISABLED'}
  </span>
</p>

                    <p className="text-sm text-gray-500">
                      {item.category || '-'} |{' '}
                      {item.brand || '-'} |{' '}
                      {item.unit || '-'}
                    </p>

                    <div className="mt-2 flex flex-wrap gap-2">
  {item.dealerCategory && (
    <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-bold text-blue-700">
      Dealer: {item.dealerCategory}
    </span>
  )}

  {Number(
  item.dealerUnitRate ||
    item.ratePerWatt ||
    0,
) > 0 && (
  <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-bold text-green-700">
    ₹
    {Number(
      item.dealerUnitRate ||
        item.ratePerWatt ||
        0,
    ).toLocaleString('en-IN')}
    /
    {String(
      item.unit ||
        (
          item.dealerCategory ===
          'PANELS'
            ? 'Watt'
            : 'Unit'
        ),
    ).trim()}
    {' + GST'}
  </span>
)}
</div>

                    <p className="text-sm text-gray-500">
  HSN: {item.hsnCode || '-'} | Vendor:{' '}
  {item.vendorPreferredName || '-'}
</p>

                    <p className="mt-1 text-sm font-semibold text-green-700">
                      ₹
                      {Number(
                        item.rate || 0,
                      ).toLocaleString(
                        'en-IN',
                      )}
                    </p>

                    <p className="mt-1 text-sm text-gray-700">
  GST: {Number(item.gstPercent || 0)}%
</p>

<p className="mt-1 text-sm text-blue-700">
  Cost with GST: ₹
  {(
    Number(item.rate || 0) +
    (Number(item.rate || 0) *
      Number(item.gstPercent || 0)) /
      100
  ).toLocaleString('en-IN')}
</p>

<p className="mt-1 text-sm text-purple-700">
  Expected Margin:{' '}
{item.marginType === 'PERCENT'
  ? `${Number(item.expectedMargin || 0)}%`
  : `₹${Number(item.expectedMargin || 0).toLocaleString(
      'en-IN',
    )}`}
</p>

<p className="mt-1 text-sm font-medium text-red-700">
  Minimum Stock Level:{' '}
  {Number(
    item.minimumStockLevel || 0,
  ).toLocaleString('en-IN')}
</p>

<p className="mt-1 text-sm font-bold text-green-700">
  Recommended Selling Price: ₹
{Number(
  item.sellingRate && item.sellingRate > 0
    ? item.sellingRate
    : Number(item.rate || 0) +
        (Number(item.rate || 0) *
          Number(item.gstPercent || 0)) /
          100 +
        (item.marginType === 'PERCENT'
          ? (Number(item.rate || 0) *
              Number(item.expectedMargin || 0)) /
            100
          : Number(item.expectedMargin || 0)),
).toLocaleString('en-IN')}
</p>

                    {item.remarks && (
                      <p className="mt-1 text-sm text-gray-600">
                        {item.remarks}
                      </p>
                    )}
                  </div>

                  {canManageMaterials && (
  <div className="flex gap-2">
  <button
    onClick={() => startEdit(item)}
    className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700"
  >
    Edit
  </button>

  <button
  onClick={() => toggleMaterialStatus(item)}
  className={`rounded-xl px-4 py-2 text-sm font-semibold text-white ${
    item.isActive
      ? 'bg-red-600 hover:bg-red-700'
      : 'bg-green-600 hover:bg-green-700'
  }`}
>
  {item.isActive ? 'Hide' : 'Restore'}
</button>
</div>
)}
                </div>
              </div>
            ))}
          </div>
        )}

        {!loading && total > 0 && (
  <div className="mt-5 flex flex-col gap-3 border-t pt-4 sm:flex-row sm:items-center sm:justify-between">
    <p className="text-sm text-gray-600">
      Showing{' '}
      {Math.min(
        (page - 1) * limit + 1,
        total,
      )}
      {' - '}
      {Math.min(
        page * limit,
        total,
      )}{' '}
      of{' '}
      {total.toLocaleString('en-IN')}
    </p>

    <div className="flex items-center gap-2">
      <button
        type="button"
        disabled={
          page <= 1 ||
          loading
        }
        onClick={() =>
          setPage((current) =>
            Math.max(
              current - 1,
              1,
            ),
          )
        }
        className="rounded-xl border px-4 py-2 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-50"
      >
        Previous
      </button>

      <span className="rounded-xl bg-gray-100 px-4 py-2 text-sm font-semibold text-gray-700">
        Page {page} of {totalPages}
      </span>

      <button
        type="button"
        disabled={
          page >= totalPages ||
          loading
        }
        onClick={() =>
          setPage((current) =>
            Math.min(
              current + 1,
              totalPages,
            ),
          )
        }
        className="rounded-xl border px-4 py-2 text-sm font-semibold disabled:cursor-not-allowed disabled:opacity-50"
      >
        Next
      </button>
    </div>
  </div>
)}
      </div>
      )}
    </div>
  );
}