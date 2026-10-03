import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/auth";

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const auth = await requireAdmin();
    if (!auth.ok) return auth.response;

    await prisma.hps_material_item.delete({
      where: { material_item_id: parseInt(params.id) },
    });

    return new Response(JSON.stringify({ message: 'Material item deleted successfully' }), {
      status: 200,
    });
  } catch (error) {
    console.error('Error deleting material item:', error);
    return new Response(JSON.stringify({ error: 'Failed to delete material item' }), {
      status: 500,
    });
  }
}