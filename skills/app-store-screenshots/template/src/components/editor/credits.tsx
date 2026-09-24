"use client";

import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

const linkClass = "underline underline-offset-4 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4";

export function Credits() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="h-11">Credits</Button>
      </DialogTrigger>
      <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Credits</DialogTitle>
          <DialogDescription>The people and resources behind this editor.</DialogDescription>
        </DialogHeader>
        <div className="space-y-5 text-sm leading-relaxed">
          <section className="space-y-2" aria-labelledby="apple-credit">
            <h2 id="apple-credit" className="font-semibold">Apple device images</h2>
            <p>The original iPhone and iPad frame images are by Apple Inc. They are included with this editor and used by default.</p>
            <p>Apple's assets have separate license terms. This editor is not affiliated with or endorsed by Apple.</p>
            <div className="flex flex-wrap gap-x-5 gap-y-2">
              <a className={linkClass} href="https://developer.apple.com/design/resources/" target="_blank" rel="noreferrer">Apple Design Resources</a>
              <a className={linkClass} href="/licenses/apple-design-resources.txt" target="_blank" rel="noreferrer">Apple asset license</a>
            </div>
          </section>
          <section className="space-y-2" aria-labelledby="editor-credit">
            <h2 id="editor-credit" className="font-semibold">Screenshot editor</h2>
            <p>Originally created by Parth Jadhav. Customer screenshot workflow and team tools maintained in Mark Weisberg's fork.</p>
            <div className="flex flex-wrap gap-x-5 gap-y-2">
              <a className={linkClass} href="https://github.com/ParthJadhav/app-store-screenshots" target="_blank" rel="noreferrer">Original project</a>
              <a className={linkClass} href="/licenses/editor-mit.txt" target="_blank" rel="noreferrer">Editor MIT license</a>
            </div>
          </section>
        </div>
      </DialogContent>
    </Dialog>
  );
}
