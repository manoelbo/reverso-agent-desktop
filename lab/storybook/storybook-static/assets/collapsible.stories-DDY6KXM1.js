import{r as e,R as t}from"./iframe-CGsI1KOa.js";import{p as s}from"./IconBase.es-Rt6yengf.js";import{B as m}from"./button-D8ZgLrYe.js";import{C as l,a as d,b as p}from"./collapsible-yQzvC5ou.js";import"./preload-helper-PPVm8Dsz.js";import"./utils-vy3jnSxZ.js";import"./index-ChJJNisk.js";import"./index-BIhGhLEQ.js";import"./index-CS3CackO.js";import"./index-KPmvTq_h.js";const c=new Map([["bold",e.createElement(e.Fragment,null,e.createElement("path",{d:"M216.49,104.49l-80,80a12,12,0,0,1-17,0l-80-80a12,12,0,0,1,17-17L128,159l71.51-71.52a12,12,0,0,1,17,17Z"}))],["duotone",e.createElement(e.Fragment,null,e.createElement("path",{d:"M208,96l-80,80L48,96Z",opacity:"0.2"}),e.createElement("path",{d:"M215.39,92.94A8,8,0,0,0,208,88H48a8,8,0,0,0-5.66,13.66l80,80a8,8,0,0,0,11.32,0l80-80A8,8,0,0,0,215.39,92.94ZM128,164.69,67.31,104H188.69Z"}))],["fill",e.createElement(e.Fragment,null,e.createElement("path",{d:"M213.66,101.66l-80,80a8,8,0,0,1-11.32,0l-80-80A8,8,0,0,1,48,88H208a8,8,0,0,1,5.66,13.66Z"}))],["light",e.createElement(e.Fragment,null,e.createElement("path",{d:"M212.24,100.24l-80,80a6,6,0,0,1-8.48,0l-80-80a6,6,0,0,1,8.48-8.48L128,167.51l75.76-75.75a6,6,0,0,1,8.48,8.48Z"}))],["regular",e.createElement(e.Fragment,null,e.createElement("path",{d:"M213.66,101.66l-80,80a8,8,0,0,1-11.32,0l-80-80A8,8,0,0,1,53.66,90.34L128,164.69l74.34-74.35a8,8,0,0,1,11.32,11.32Z"}))],["thin",e.createElement(e.Fragment,null,e.createElement("path",{d:"M210.83,98.83l-80,80a4,4,0,0,1-5.66,0l-80-80a4,4,0,0,1,5.66-5.66L128,170.34l77.17-77.17a4,4,0,1,1,5.66,5.66Z"}))]]),o=e.forwardRef((a,n)=>e.createElement(s,{ref:n,...a,weights:c}));o.displayName="CaretDownIcon";const i=o,v={title:"ui/Collapsible",component:l},r={render:()=>{const[a,n]=e.useState(!0);return t.createElement("div",{className:"max-w-md p-6"},t.createElement(l,{open:a,onOpenChange:n,className:"rounded-lg border border-border/60 bg-card"},t.createElement(d,{asChild:!0},t.createElement(m,{variant:"ghost",className:"w-full justify-between rounded-b-none rounded-t-lg"},"Mostrar detalhes",t.createElement(i,{className:`size-4 transition-transform ${a?"rotate-180":""}`}))),t.createElement(p,null,t.createElement("div",{className:"space-y-2 p-4 text-sm text-muted-foreground"},t.createElement("p",null,"Componente ideal para sessões de metadados e árvore de dossiê."),t.createElement("p",null,"Estado atual: ",a?"aberto":"fechado",".")))))}};r.parameters={...r.parameters,docs:{...r.parameters?.docs,source:{originalSource:`{
  render: () => {
    const [open, setOpen] = useState(true);
    return <div className="max-w-md p-6">
        <Collapsible open={open} onOpenChange={setOpen} className="rounded-lg border border-border/60 bg-card">
          <CollapsibleTrigger asChild>
            <Button variant="ghost" className="w-full justify-between rounded-b-none rounded-t-lg">
              Mostrar detalhes
              <CaretDown className={\`size-4 transition-transform \${open ? "rotate-180" : ""}\`} />
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent>
            <div className="space-y-2 p-4 text-sm text-muted-foreground">
              <p>Componente ideal para sessões de metadados e árvore de dossiê.</p>
              <p>Estado atual: {open ? "aberto" : "fechado"}.</p>
            </div>
          </CollapsibleContent>
        </Collapsible>
      </div>;
  }
}`,...r.parameters?.docs?.source}}};const x=["Default"];export{r as Default,x as __namedExportsOrder,v as default};
