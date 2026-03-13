import{R as e}from"./iframe-9S5LuuTj.js";import{S as m}from"./scroll-area-CXdlHIPh.js";import"./preload-helper-PPVm8Dsz.js";import"./utils-vy3jnSxZ.js";import"./index-BErSN80w.js";import"./index-Cco4bJ8O.js";import"./index-DXX1l05D.js";import"./index-afAih3at.js";import"./index-BjMwMsYB.js";const v={title:"ui/ScrollArea",component:m},o=Array.from({length:32}).map((a,d)=>`Item de evidence #${d+1}`),r={render:()=>e.createElement("div",{className:"p-6"},e.createElement(m,{className:"h-72 w-full max-w-md rounded-md border border-border/60 bg-card"},e.createElement("div",{className:"space-y-2 p-4"},o.map(a=>e.createElement("div",{key:a,className:"rounded-md border border-border/50 px-3 py-2 text-sm"},a)))))};r.parameters={...r.parameters,docs:{...r.parameters?.docs,source:{originalSource:`{
  render: () => <div className="p-6">
      <ScrollArea className="h-72 w-full max-w-md rounded-md border border-border/60 bg-card">
        <div className="space-y-2 p-4">
          {items.map(item => <div key={item} className="rounded-md border border-border/50 px-3 py-2 text-sm">
              {item}
            </div>)}
        </div>
      </ScrollArea>
    </div>
}`,...r.parameters?.docs?.source}}};const f=["Default"];export{r as Default,f as __namedExportsOrder,v as default};
