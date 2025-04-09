import { Skeleton } from "../ui/skeleton";

export default function Loading() {
    return (
        <div className="flex gap-8 h-dvh p-6">
            <Skeleton className="h-full w-2/12" />
            <Skeleton className="h-2/4 w-10/12" />
        </div>
    );
}

