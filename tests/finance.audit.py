"""Independent Decimal financing specification against the production JS API."""
import json
import random
import subprocess
from decimal import Decimal, localcontext

rng = random.Random(22)
cases = [dict(own=rng.choice([0, 3, 10, 20, 30]), partner=0, reserve=0, loan=rng.choice([0, 2, 6, 10]), ltv=rng.choice([0, 40, 70, 99]), interest=rng.choice([0, 1e-12, 4, 15]), years=rng.choice([1, 30, 50]), monthly=rng.choice([0, 100, 200])) for _ in range(40)]
cases += [dict(own=3, partner=0, reserve=0, loan=6, ltv=70, interest=4, years=.5, monthly=0)]
prices = [0.01, 3, 5, 10, 14.9999, 15, 15.0001, 24.9999, 25, 25.0001, 30, 40]
js = "const E=require('./site/engine.js');let s='';process.stdin.on('data',d=>s+=d);process.stdin.on('end',()=>{const x=JSON.parse(s);console.log(JSON.stringify(x.cases.map(c=>{try{const v=E.purchaseScenario(c);return {budget:v.budget,payment:v.payment(1),fits:x.prices.map(p=>E.purchaseFit(p,v))}}catch(e){return {error:true}}})))})"
actual = json.loads(subprocess.run(['node', '-e', js], input=json.dumps(dict(cases=cases, prices=prices)), text=True, capture_output=True, check=True).stdout)
for case, result in zip(cases, actual):
    if case['years'] < 1:
        assert result.get('error'), 'Sub-one-year term must be rejected by the stated 1–50 year input contract'
        continue
    with localcontext() as ctx:
        ctx.prec = 60
        D = lambda n: Decimal(str(n))
        months = D(case['years']) * 12
        rate = D(case['interest']) / 1200
        factor = 1 / months if not rate else rate / (1 - (1+rate)**(-months))
        payment = factor * 10000
        assert abs(D(result['payment']) - payment) <= max(D('1e-8'), payment * D('1e-9')), (case, result['payment'], str(payment))
        cash = D(case['own']) + D(case['partner']) - D(case['reserve'])
        for price, fit in zip(prices, result['fits']):
            price = D(price)
            needed = max(D(0), price-cash)
            cap = 6 if price <= 15 else 4 if price <= 25 else 2
            allowed = needed <= D(case['loan']) and needed <= price*D(case['ltv'])/100 and needed <= cap and (not case['monthly'] or needed*payment <= D(case['monthly']))
            assert bool(fit) == allowed, (case, str(price), fit, allowed)
print('Independent finance audit: 41 scenarios, 480 affordability boundaries, Decimal mortgage checks and invalid term passed')
