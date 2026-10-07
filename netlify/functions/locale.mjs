export default async function locale(_request,context){
  const country=context?.geo?.country?.code||null;
  return new Response(JSON.stringify({country}),{
    headers:{'content-type':'application/json; charset=utf-8','cache-control':'private, no-store'}
  });
}
