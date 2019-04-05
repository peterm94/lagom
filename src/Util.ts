export class Util {
    /**
     * Convenience list removal function.
     * @param list The list to remove an element from.
     * @param element The element to remove.
     */
    static remove<T>(list: T[], element: T) {
        const idx = list.indexOf(element);

        if (idx > -1) {
            list.splice(idx, 1);
        }
    }
}