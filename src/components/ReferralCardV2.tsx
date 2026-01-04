import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Loader2, Copy, Users, Gift, TrendingUp, ChevronDown, ChevronRight } from 'lucide-react';
import { useReferralV2 } from '@/hooks/useReferralV2';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Progress } from '@/components/ui/progress';

const ReferralCardV2 = () => {
  const {
    referralCode,
    stats,
    hasUsedReferral,
    loading,
    referralTree,
    applyReferralCode,
    copyReferralLink,
    REFERRAL_LEVELS
  } = useReferralV2();

  const [inputCode, setInputCode] = useState('');
  const [applying, setApplying] = useState(false);
  const [copied, setCopied] = useState(false);
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set());

  const handleApplyCode = async () => {
    if (!inputCode.trim()) return;
    setApplying(true);
    await applyReferralCode(inputCode.trim());
    setApplying(false);
    setInputCode('');
  };

  const handleCopy = () => {
    copyReferralLink();
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const toggleNode = (id: string) => {
    const newExpanded = new Set(expandedNodes);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedNodes(newExpanded);
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8 flex justify-center">
          <Loader2 className="h-6 w-6 animate-spin" />
        </CardContent>
      </Card>
    );
  }

  const ReferralNode = ({ node, level }: { node: any; level: number }) => {
    const hasChildren = node.children && node.children.length > 0;
    const isExpanded = expandedNodes.has(node.id);
    const levelColor = level === 1 ? 'text-primary' : level === 2 ? 'text-green-500' : 'text-yellow-500';

    return (
      <div className="ml-4">
        <div 
          className={`flex items-center gap-2 py-1 cursor-pointer hover:bg-muted/50 rounded px-2 ${hasChildren ? '' : 'ml-5'}`}
          onClick={() => hasChildren && toggleNode(node.id)}
        >
          {hasChildren && (
            isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />
          )}
          <Users className={`h-4 w-4 ${levelColor}`} />
          <span className="text-sm">{node.username}</span>
          {node.totalSpent > 0 && (
            <Badge variant="outline" className="text-xs">
              {node.totalSpent.toFixed(0)} ₴
            </Badge>
          )}
          <Badge variant="secondary" className="text-xs">
            L{level}
          </Badge>
        </div>
        {hasChildren && isExpanded && (
          <div className="border-l border-border ml-2">
            {node.children.map((child: any) => (
              <ReferralNode key={child.id} node={child} level={level + 1} />
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Gift className="h-5 w-5 text-primary" />
          Реферальна програма v2
        </CardTitle>
        <CardDescription>
          Багаторівнева система винагород: отримуйте бонуси від рефералів до 3-го рівня
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Referral Code */}
        {referralCode && (
          <div className="p-4 bg-primary/10 rounded-lg">
            <p className="text-sm text-muted-foreground mb-2">Ваш реферальний код</p>
            <div className="flex items-center gap-2">
              <code className="text-2xl font-bold tracking-wider flex-1">{referralCode}</code>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleCopy}
              >
                <Copy className="h-4 w-4 mr-1" />
                {copied ? 'Скопійовано!' : 'Копіювати'}
              </Button>
            </div>
          </div>
        )}

        {/* Level Bonuses */}
        <div className="space-y-3">
          <h4 className="font-semibold flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            Рівні винагород
          </h4>
          {REFERRAL_LEVELS.map((level) => (
            <div key={level.level} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
              <div className="flex items-center gap-3">
                <Badge variant={level.level === 1 ? 'default' : level.level === 2 ? 'secondary' : 'outline'}>
                  L{level.level}
                </Badge>
                <span className="text-sm">{level.label}</span>
              </div>
              <span className="font-bold text-primary">+{level.bonus} ₴</span>
            </div>
          ))}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center p-3 bg-muted/50 rounded-lg">
            <div className="text-2xl font-bold text-primary">{stats.level1.count}</div>
            <div className="text-xs text-muted-foreground">Рівень 1</div>
          </div>
          <div className="text-center p-3 bg-muted/50 rounded-lg">
            <div className="text-2xl font-bold text-green-500">{stats.level2.count}</div>
            <div className="text-xs text-muted-foreground">Рівень 2</div>
          </div>
          <div className="text-center p-3 bg-muted/50 rounded-lg">
            <div className="text-2xl font-bold text-yellow-500">{stats.level3.count}</div>
            <div className="text-xs text-muted-foreground">Рівень 3</div>
          </div>
          <div className="text-center p-3 bg-muted/50 rounded-lg">
            <div className="text-2xl font-bold">{stats.totalEarned.toFixed(0)} ₴</div>
            <div className="text-xs text-muted-foreground">Всього зароблено</div>
          </div>
        </div>

        {/* Earnings Breakdown */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span>Рівень 1</span>
            <span>{stats.level1.earned.toFixed(0)} ₴</span>
          </div>
          <Progress value={stats.totalEarned > 0 ? (stats.level1.earned / stats.totalEarned) * 100 : 0} className="h-2" />
          
          <div className="flex justify-between text-sm">
            <span>Рівень 2</span>
            <span>{stats.level2.earned.toFixed(0)} ₴</span>
          </div>
          <Progress value={stats.totalEarned > 0 ? (stats.level2.earned / stats.totalEarned) * 100 : 0} className="h-2 bg-green-500/20 [&>div]:bg-green-500" />
          
          <div className="flex justify-between text-sm">
            <span>Рівень 3</span>
            <span>{stats.level3.earned.toFixed(0)} ₴</span>
          </div>
          <Progress value={stats.totalEarned > 0 ? (stats.level3.earned / stats.totalEarned) * 100 : 0} className="h-2 bg-yellow-500/20 [&>div]:bg-yellow-500" />
        </div>

        {/* Referral Tree */}
        {referralTree.length > 0 && (
          <Collapsible>
            <CollapsibleTrigger asChild>
              <Button variant="outline" className="w-full">
                <Users className="h-4 w-4 mr-2" />
                Дерево рефералів ({stats.totalReferrals})
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="mt-4 max-h-60 overflow-y-auto border rounded-lg p-2">
              {referralTree.map((node) => (
                <ReferralNode key={node.id} node={node} level={1} />
              ))}
            </CollapsibleContent>
          </Collapsible>
        )}

        {/* Pending */}
        {stats.totalPending > 0 && (
          <div className="p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
            <p className="text-sm text-yellow-600">
              ⏳ {stats.totalPending} реферал(ів) очікують на першу покупку
            </p>
          </div>
        )}

        {/* Apply Code */}
        {!hasUsedReferral && (
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">Маєте реферальний код?</p>
            <div className="flex gap-2">
              <Input
                placeholder="Введіть код"
                value={inputCode}
                onChange={(e) => setInputCode(e.target.value.toUpperCase())}
                className="uppercase"
              />
              <Button onClick={handleApplyCode} disabled={applying || !inputCode.trim()}>
                {applying ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Застосувати'}
              </Button>
            </div>
          </div>
        )}

        {hasUsedReferral && (
          <p className="text-sm text-muted-foreground text-center">
            ✅ Ви вже використали реферальний код
          </p>
        )}
      </CardContent>
    </Card>
  );
};

export default ReferralCardV2;
