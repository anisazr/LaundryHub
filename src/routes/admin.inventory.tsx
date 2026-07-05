import { createFileRoute } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import {
  addStockPurchase,
  getEstimatedCapacity,
  getFinancialSummary,
  getStockUsageText,
  upsertStockItem,
  useLaundryData,
} from "@/lib/laundry-store";
import { formatRupiah, type StockItem } from "@/lib/mock-data";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertTriangle, PackagePlus, Pencil, Plus, ShoppingCart, X } from "lucide-react";
import { FormEvent, useEffect, useState } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/admin/inventory")({
  head: () => ({ meta: [{ title: "Inventori - Admin" }] }),
  component: InventoryPage,
});

type ItemForm = {
  id?: string;
  name: string;
  unit: string;
  qty: string;
  minQty: string;
  purchasePrice: string;
  supplier: string;
};

const emptyItemForm: ItemForm = {
  name: "",
  unit: "",
  qty: "0",
  minQty: "",
  purchasePrice: "",
  supplier: "",
};

const formFromItem = (item: StockItem): ItemForm => ({
  id: item.id,
  name: item.name,
  unit: item.unit,
  qty: String(item.qty),
  minQty: String(item.minQty),
  purchasePrice: String(item.purchasePrice),
  supplier: item.supplier,
});

function InventoryPage() {
  const { data, update } = useLaundryData();
  const finance = getFinancialSummary(data);
  const [showPurchaseForm, setShowPurchaseForm] = useState(false);
  const [showItemForm, setShowItemForm] = useState(false);
  const [stockId, setStockId] = useState(data.stock[0]?.id ?? "");
  const [qty, setQty] = useState("");
  const [cost, setCost] = useState("");
  const [supplier, setSupplier] = useState("");
  const [purchaseError, setPurchaseError] = useState("");
  const [itemForm, setItemForm] = useState<ItemForm>(emptyItemForm);
  const [itemError, setItemError] = useState("");
  const lowCount = data.stock.filter((item) => item.qty < item.minQty).length;
  const selectedItem = data.stock.find((item) => item.id === stockId);

  useEffect(() => {
    if (!selectedItem) return;
    setSupplier(selectedItem.supplier);
    const qtyValue = Number(qty);
    if (qtyValue > 0) {
      setCost(String(Math.round(qtyValue * selectedItem.purchasePrice)));
    }
  }, [selectedItem?.id]);

  function openPurchaseForm() {
    setShowPurchaseForm(true);
    setShowItemForm(false);
    setPurchaseError("");
  }

  function openNewItemForm() {
    setItemForm(emptyItemForm);
    setItemError("");
    setShowItemForm(true);
    setShowPurchaseForm(false);
  }

  function openEditItemForm(item: StockItem) {
    setItemForm(formFromItem(item));
    setItemError("");
    setShowItemForm(true);
    setShowPurchaseForm(false);
  }

  function handleQtyChange(value: string) {
    setQty(value);
    const qtyValue = Number(value);
    if (selectedItem && qtyValue > 0) {
      setCost(String(Math.round(qtyValue * selectedItem.purchasePrice)));
    } else {
      setCost("");
    }
  }

  function handlePurchase(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const qtyValue = Number(qty);
    const costValue = Number(cost);
    const valid = stockId && supplier.trim() && qtyValue > 0 && costValue > 0;

    if (!valid) {
      setPurchaseError("Semua data pembelian wajib diisi. Qty dan biaya harus lebih dari 0.");
      return;
    }
    if (costValue > finance.cash) {
      setPurchaseError(`Saldo kas tidak cukup. Kas tersedia ${formatRupiah(finance.cash)}.`);
      return;
    }

    update((current) =>
      addStockPurchase(current, {
        stockId,
        qty: qtyValue,
        cost: costValue,
        supplier,
      }),
    );

    setQty("");
    setCost("");
    setSupplier("");
    setPurchaseError("");
    setShowPurchaseForm(false);
    toast.success("Pembelian stok tersimpan", {
      description: `Biaya ${formatRupiah(costValue)} tercatat sebagai pengeluaran.`,
    });
  }

  function handleItemSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const qtyValue = Number(itemForm.qty);
    const minQtyValue = Number(itemForm.minQty);
    const purchasePriceValue = Number(itemForm.purchasePrice);
    const valid =
      itemForm.name.trim() &&
      itemForm.unit.trim() &&
      itemForm.supplier.trim() &&
      qtyValue >= 0 &&
      minQtyValue > 0 &&
      purchasePriceValue > 0;

    if (!valid) {
      setItemError("Nama, satuan, stok minimum, harga beli, dan supplier wajib diisi dengan benar.");
      return;
    }

    update((current) =>
      upsertStockItem(current, {
        id: itemForm.id,
        name: itemForm.name,
        unit: itemForm.unit,
        qty: qtyValue,
        minQty: minQtyValue,
        purchasePrice: purchasePriceValue,
        supplier: itemForm.supplier,
      }),
    );

    setItemForm(emptyItemForm);
    setItemError("");
    setShowItemForm(false);
    toast.success(itemForm.id ? "Item inventori diperbarui" : "Item inventori baru ditambahkan");
  }

  return (
    <AppShell role="admin">
      <div className="mb-6 flex items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight">Stok Deterjen & Perlengkapan</h2>
          <p className="text-sm text-muted-foreground">{lowCount} item di bawah stok minimum.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={openNewItemForm}>
            <PackagePlus className="mr-2 h-4 w-4" />
            Tambah Item
          </Button>
          <Button onClick={openPurchaseForm}>
            <ShoppingCart className="mr-2 h-4 w-4" />
            Beli / Restok
          </Button>
        </div>
      </div>

      <div className="mb-6 grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-5">
            <div className="text-sm text-muted-foreground">Modal Awal</div>
            <div className="text-xl font-semibold">{formatRupiah(finance.capital)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <div className="text-sm text-muted-foreground">Saldo Kas</div>
            <div className="text-xl font-semibold text-primary">{formatRupiah(finance.cash)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <div className="text-sm text-muted-foreground">Pemasukan</div>
            <div className="text-xl font-semibold text-success">{formatRupiah(finance.revenue)}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5">
            <div className="text-sm text-muted-foreground">Pengeluaran</div>
            <div className="text-xl font-semibold text-destructive">{formatRupiah(finance.expenses)}</div>
          </CardContent>
        </Card>
      </div>

      {showItemForm && (
        <Card className="mb-6">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>{itemForm.id ? "Edit Item Inventori" : "Tambah Item Inventori"}</CardTitle>
            <Button variant="ghost" size="icon" onClick={() => setShowItemForm(false)}>
              <X className="h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent>
            <form className="grid gap-4 md:grid-cols-3" onSubmit={handleItemSubmit}>
              <div className="space-y-1.5">
                <Label htmlFor="itemName">Nama Item</Label>
                <Input
                  id="itemName"
                  value={itemForm.name}
                  onChange={(event) => setItemForm((current) => ({ ...current, name: event.target.value }))}
                  placeholder="Mis. Deterjen Premium Supplier B"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="unit">Satuan</Label>
                <Input
                  id="unit"
                  value={itemForm.unit}
                  onChange={(event) => setItemForm((current) => ({ ...current, unit: event.target.value }))}
                  placeholder="Liter, pcs, kg"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="itemSupplier">Supplier</Label>
                <Input
                  id="itemSupplier"
                  value={itemForm.supplier}
                  onChange={(event) => setItemForm((current) => ({ ...current, supplier: event.target.value }))}
                  placeholder="Nama supplier"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="itemQty">Stok Saat Ini</Label>
                <Input
                  id="itemQty"
                  type="number"
                  min="0"
                  step="0.01"
                  value={itemForm.qty}
                  onChange={(event) => setItemForm((current) => ({ ...current, qty: event.target.value }))}
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="minQty">Stok Minimum</Label>
                <Input
                  id="minQty"
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={itemForm.minQty}
                  onChange={(event) => setItemForm((current) => ({ ...current, minQty: event.target.value }))}
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="purchasePrice">Harga Beli per Satuan</Label>
                <Input
                  id="purchasePrice"
                  type="number"
                  min="1"
                  value={itemForm.purchasePrice}
                  onChange={(event) => setItemForm((current) => ({ ...current, purchasePrice: event.target.value }))}
                  required
                />
              </div>
              {itemError && (
                <div className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive md:col-span-3">
                  {itemError}
                </div>
              )}
              <div className="flex gap-2 md:col-span-3">
                <Button type="submit">{itemForm.id ? "Simpan Perubahan Item" : "Simpan Item"}</Button>
                <Button type="button" variant="outline" onClick={() => setShowItemForm(false)}>
                  Batal
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {showPurchaseForm && (
        <Card className="mb-6">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Pembelian / Restok</CardTitle>
            <Button variant="ghost" size="icon" onClick={() => setShowPurchaseForm(false)}>
              <X className="h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent>
            <form className="grid gap-4 md:grid-cols-4" onSubmit={handlePurchase}>
              <div className="space-y-1.5">
                <Label>Item</Label>
                <Select value={stockId} onValueChange={setStockId} required>
                  <SelectTrigger>
                    <SelectValue placeholder="Pilih item" />
                  </SelectTrigger>
                  <SelectContent>
                    {data.stock.map((item) => (
                      <SelectItem key={item.id} value={item.id}>
                        {item.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="qty">Qty Beli {selectedItem ? `(${selectedItem.unit})` : ""}</Label>
                <Input
                  id="qty"
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={qty}
                  onChange={(event) => handleQtyChange(event.target.value)}
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="cost">Total Biaya Pembelian</Label>
                <Input
                  id="cost"
                  type="number"
                  min="1"
                  value={cost}
                  onChange={(event) => setCost(event.target.value)}
                  required
                />
                {selectedItem && (
                  <div className="text-xs text-muted-foreground">
                    Harga beli: {formatRupiah(selectedItem.purchasePrice)} / {selectedItem.unit}
                  </div>
                )}
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="supplier">Supplier</Label>
                <Input
                  id="supplier"
                  value={supplier}
                  onChange={(event) => setSupplier(event.target.value)}
                  placeholder="Nama supplier"
                  required
                />
                <div className="text-xs text-muted-foreground">
                  Supplier bawaan dari master item, masih bisa diganti saat transaksi.
                </div>
              </div>
              {purchaseError && (
                <div className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive md:col-span-4">
                  {purchaseError}
                </div>
              )}
              <div className="md:col-span-4">
                <div className="mb-3 rounded-md bg-secondary px-3 py-2 text-xs text-secondary-foreground">
                  Pembelian akan menambah stok dan mengurangi saldo kas sebesar biaya pembelian.
                </div>
                <Button type="submit">
                  <Plus className="mr-2 h-4 w-4" />
                  Simpan Pembelian
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Daftar Item</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Item</TableHead>
                <TableHead>Stok</TableHead>
                <TableHead>Minimum</TableHead>
                <TableHead>Harga Beli</TableHead>
                <TableHead>Supplier</TableHead>
                <TableHead>Pemakaian Otomatis</TableHead>
                <TableHead>Estimasi Cukup Untuk</TableHead>
                <TableHead className="w-[24%]">Level</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data.stock.map((item) => {
                const pct = Math.min(100, (item.qty / (item.minQty * 2)) * 100);
                const low = item.qty < item.minQty;
                const capacity = getEstimatedCapacity(item);
                return (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">{item.name}</TableCell>
                    <TableCell>
                      {item.qty} {item.unit}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {item.minQty} {item.unit}
                    </TableCell>
                    <TableCell>{formatRupiah(item.purchasePrice)} / {item.unit}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{item.supplier}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">{getStockUsageText(item)}</TableCell>
                    <TableCell>
                      {capacity === null ? (
                        <span className="text-xs text-muted-foreground">Manual</span>
                      ) : (
                        <span className="text-xs font-medium">{capacity} kg cucian</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Progress value={pct} className={low ? "[&>div]:bg-destructive" : ""} />
                    </TableCell>
                    <TableCell>
                      {low ? (
                        <span className="inline-flex items-center gap-1 text-xs font-medium text-destructive">
                          <AlertTriangle className="h-3.5 w-3.5" />
                          Perlu restock
                        </span>
                      ) : (
                        <span className="text-xs font-medium text-success">Aman</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Button size="sm" variant="ghost" onClick={() => openEditItemForm(item)}>
                        <Pencil className="mr-1.5 h-3.5 w-3.5" />
                        Edit
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </AppShell>
  );
}
