
export function debounce(func: Function, timeout = 350){
  let timer: ReturnType<typeof setTimeout>;
  return (...args: any[]) => {
    clearTimeout(timer);
	// @ts-expect-error bits idk
    timer = setTimeout(() => func.apply(this, args), timeout);
  };
}
