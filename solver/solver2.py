#!/usr/bin/env python3
"""Rally garden v39 solver — backtracking, asymmetric zones.
Zones (anchor membership): East c-r>=2 (28 tiles, 6 gated items),
West r-c>=3 (21 tiles, 4 gated), Center -2<=c-r<=1 (32 tiles).
Gates: interior containment, tile-footprint non-overlap (pond+bridge paired),
faithful gdCheckPlan port (stage-1 sprites, 18% shrink, >35%-of-smaller fails),
path chain contiguity cottage->pond."""
import json, random, itertools, sys, time

CFG = json.load(open("garden-config.json")); SPR = CFG["sprites"]
DX, DY = 700/11, 350/11
def gdXY(c, r): return (750 + (c-r)*DX, 220 + (c+r)*DY)
def spget(s): return SPR.get(s) or SPR.get(s+"-quiet") or SPR.get(s+"-full")

ITEMS = [("ct","cottage","C"),("pond","pond","C"),("gA","grove","C"),
 ("fA","flowerbed","C"),("s1","path-stone-1","C"),("s2","path-stone-2","C"),
 ("s3","path-stone-3","C"),("hb-steps","hb-steps","C"),("hb-reading","hb-reading","C"),
 ("hb-meditation","hb-meditation","C"),("hb-workout","hb-workout","C"),
 ("gB","grove","E"),("arbor","arbor","E"),("bench","bench","E"),
 ("bam","bamboo-cluster","E"),("eA","flowerbed","E"),("eB","flowerbed","E"),
 ("gC","grove","W"),("cherry","cherry-tree","W"),("wA","flowerbed","W"),
 ("wB","flowerbed","W"),("hb-sleep","hb-sleep","W"),("hb-journal","hb-journal","W")]
EL = {k:e for k,e,_ in ITEMS}; ZONE = {k:z for k,_,z in ITEMS}
FP = {k: tuple(spget(e if e not in ("grove","cottage") else e+"-1")["fp"]) for k,e,_ in ITEMS}

def in_zone(z,c,r):
    d=c-r
    return (-2<=d<=1) if z=="C" else (d>=2) if z=="E" else (d<=-3)
def rect(k,c,r): w,h=FP[k]; return (c-w/2,c+w/2,r-h/2,r+h/2)
def contained(k,c,r):
    x0,x1,y0,y1=rect(k,c,r); return x0>=0.5 and y0>=0.5 and x1<=9.5 and y1<=9.5
def ov(a,b): return max(0,min(a[1],b[1])-max(a[0],b[0]))*max(0,min(a[3],b[3])-max(a[2],b[2]))

GATE_SID = {"gA":"grove-1","gB":"grove-1","gC":"grove-1","ct":"cottage-1",
 "fA":"flowerbed","eA":"flowerbed","eB":"flowerbed","wA":"flowerbed","wB":"flowerbed",
 "arbor":"arbor","bench":"bench","bam":"bamboo-cluster","cherry":"cherry-tree"}
def prect(k,c,r):
    sp=spget(GATE_SID[k]); x,y=gdXY(c,r); a=sp["a"]; cw=a[0]*2; ch=a[1]+40; m=0.18
    return (x-a[0]+cw*m, x-a[0]+cw*(1-m), y-a[1]+ch*m, y-a[1]+ch*(1-m))
def pixok(ka,pa,kb,pb):
    if ka not in GATE_SID or kb not in GATE_SID: return True
    A,B = prect(ka,*pa), prect(kb,*pb); inter=ov(A,B)
    small=min((A[1]-A[0])*(A[3]-A[2]),(B[1]-B[0])*(B[3]-B[2]))
    return not (small>0 and inter/small>0.35)

SEED = {"ct":(3,3),"pond":(6,7),"gA":(8,8),"fA":(1,3),"s1":(4,4),"s2":(5,5),
 "s3":(5,6),"hb-steps":(2,4),"hb-reading":(1,1),"hb-meditation":(8,7),
 "hb-workout":(7,6),"gB":(7,3),"arbor":(5,1),"bench":(8,5),"bam":(9,3),
 "eA":(4,2),"eB":(9,6),"wA":(1,5),"gC":(2,7),"cherry":(4,8),"wB":(2,5),
 "hb-sleep":(2,9),"hb-journal":(5,9)}
DOM = {k:[(c,r) for c in range(1,10) for r in range(1,10)
          if in_zone(ZONE[k],c,r) and contained(k,c,r)] for k in EL}

def compat(k,p,pos):
    rp=rect(k,*p)
    for b,pb in pos.items():
        if ov(rp,rect(b,*pb))>1e-9: return False
        if not pixok(k,p,b,pb): return False
    return True

ORDER = sorted(EL, key=lambda k: (len(DOM[k]), -(FP[k][0]*FP[k][1])))

def solve(seedval, deadline):
    rnd = random.Random(seedval)
    doms = {k: sorted(DOM[k], key=lambda p: abs(p[0]-SEED[k][0])+abs(p[1]-SEED[k][1])+rnd.random()*2.5) for k in EL}
    pos = {}
    def bt(i):
        if time.time() > deadline: return False
        if i == len(ORDER):
            return chain_fix(pos)
        k = ORDER[i]
        for p in doms[k]:
            if compat(k,p,pos):
                pos[k]=p
                if bt(i+1): return True
                del pos[k]
        return False
    def chain_fix(pos):
        s=[pos["s1"],pos["s2"],pos["s3"]]
        if not all(max(abs(a[0]-b[0]),abs(a[1]-b[1]))==1 for a,b in zip(s,s[1:])): return False
        ct,pd=pos["ct"],pos["pond"]
        d0=max(abs(s[0][0]-ct[0]),abs(s[0][1]-ct[1]))
        d1=max(abs(s[2][0]-pd[0]),abs(s[2][1]-pd[1]))
        return d0<=3 and d1<=3
    return pos if bt(0) else None

sol=None
for sv in range(60):
    r = solve(sv, time.time()+6)
    if r: sol=r; print(f"solved on restart {sv}"); break
if not sol: print("NO SOLUTION"); sys.exit(1)
sol["bridge"]=sol["pond"]
for k,_,_ in ITEMS: print(f"  {k:14s} {EL[k]:16s} {ZONE[k]} {sol[k]}")
print(f"  bridge         bridge           C {sol['bridge']}")
warns=[(a,b) for a,b in itertools.combinations([k for k in sol if k in GATE_SID],2)
       if not pixok(a,sol[a],b,sol[b])]
print("pixel gate:", warns if warns else "PASS (0 warns)")
tile_bad=[(a,b) for a,b in itertools.combinations([k for k in sol if k!="bridge"],2)
          if ov(rect(a,*sol[a]),rect(b,*sol[b]))>1e-9]
print("tile overlap:", tile_bad if tile_bad else "PASS (0 overlaps)")
json.dump({k:list(v) for k,v in sol.items()}, open("solved-layout.json","w"), indent=1)
