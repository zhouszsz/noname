'use strict';
game.import('character',function(lib,game,ui,get,ai,_status){
	return {
		//clan n.宗派;(尤指苏格兰的)宗族，氏族，家族;庞大的家族;帮派;小集团
		name:'clan',
		connect:true,
		character:{
			clan_wuxian:['female','shu',3,['clanyirong','clanguixiang','clanmuyin'],['clan:陈留吴氏']],
			clan_wuban:['male','shu',4,['clanzhanding','clanmuyin'],['clan:陈留吴氏']],
			clan_xunshu:['male','qun',3,['clanshenjun','clanbalong','clandaojie'],['clan:颍川荀氏']],
			clan_xunchen:['male','qun',3,['clansankuang','clanbeishi','clandaojie'],['clan:颍川荀氏']],
			clan_xuncai:['female','qun',3,['clanlieshi','clandianzhan','clanhuanyin','clandaojie'],['clan:颍川荀氏']],
			clan_xuncan:['male','wei',3,['clanyunshen','clanshangshen','clanfenchai','clandaojie'],['clan:颍川荀氏']],
			clan_hanshao:['male','qun',3,['clanfangzhen','clanliuju','clanxumin'],['clan:颍川韩氏']],
			clan_hanrong:['male','qun',3,['clanlianhe','clanhuanjia','clanxumin'],['clan:颍川韩氏']],
		},
		characterSort:{
			clan:{
				clan_wu:['clan_wuxian','clan_wuban'],
				clan_xun:['clan_xunshu','clan_xunchen','clan_xuncai','clan_xuncan'],
				clan_han:['clan_hanshao','clan_hanrong'],
			},
		},
		skill:{
			//族韩韶
			clanfangzhen:{
				audio:2,
				trigger:{player:'phaseUseBegin'},
				filter:function(event,player){
					return game.hasPlayer(current=>!current.isLinked());
				},
				direct:true,
				content:function(){
					'step 0'
					player.chooseTarget(get.prompt2('clanfangzhen'),(card,player,target)=>{
						return !target.isLinked();
					}).set('ai',target=>{
						var player=_status.event.player;
						if(_status.event.goon&&target!=player){
							target.classList.add('linked');
							target.classList.add('linked2');
							try{
								var cards=player.getCards('hs',cardx=>{
									return get.name(cardx)=='sha'&&lib.linked.contains(get.nature(cardx));
								});
								cards.map(i=>[i,get.effect(target,i,player,player)]);
								cards.sort((a,b)=>b[1]-a[1]);
							}
							catch(e){
								target.classList.remove('linked');
								target.classList.remove('linked2');
							}
							target.classList.remove('linked');
							target.classList.remove('linked2');
							var eff=cards[0][1];
							if(eff>0) return eff;
							return Math.max((get.effect(target,{name:'wuzhong'},player,player)+get.effect(player,{name:'wuzhong'},player,player)/3),get.recoverEffect(target,player,player));
						}
						return Math.max((get.effect(target,{name:'wuzhong'},player,player)+get.effect(player,{name:'wuzhong'},player,player)/3),get.recoverEffect(target,player,player));
					}).set('goon',player.countCards('hs',card=>{
						return get.name(card)=='jiu'&&player.hasUseTarget(card);
					})&&player.countCards('hs',card=>{
						return get.name(card)=='sha'&&lib.linked.contains(get.nature(card));
					}));
					'step 1'
					if(result.bool){
						var target=result.targets[0];
						event.target=target;
						player.logSkill('clanfangzhen',target);
						player.addSkill('clanfangzhen_remove');
						player.markAuto('clanfangzhen_remove',[target.getSeatNum()]);
						target.link(true);
						var choices=['选项一'],choiceList=[
							'摸两张牌，然后交给'+get.translation(target)+'两张牌',
							'令'+get.translation(target)+'回复1点体力'
						];
						if(target.isDamaged()) choices.push('选项二');
						else choiceList[1]='<span style="opacity:0.5; ">'+choiceList[1]+'</span>';
						player.chooseControl(choices).set('prompt','放赈：请选择一项').set('choiceList',choiceList).set('ai',()=>{
							var player=_status.event.player,target=_status.event.getParent().target;
							if(!target.isDamaged()) return 0;
							if(get.attitude(player,target)<=0&&player.countCards('he',card=>get.value(card)<0)>=2) return 0;
							return (get.effect(target,{name:'wuzhong'},player,player)+get.effect(player,{name:'wuzhong'},player,player)/3)>get.recoverEffect(target,player,player)?0:1;
						});
					}
					else event.finish();
					'step 2'
					if(result.control=='选项一'){
						player.draw(2);
						if(player==target) event.finish();
					}
					else{
						target.recover();
						event.finish();
					}
					'step 3'
					if(!player.countCards('he')) event.finish();
					else if(player.countCards('he')<=2) event._result={bool:true,cards:player.getCards('he')};
					else{
						player.chooseCard('放赈：交给'+get.translation(target)+'两张牌','he',2,true);
					}
					'step 4'
					if(result.bool){
						player.give(result.cards,target);
					}
				},
				ai:{
					expose:0.2,
				},
				subSkill:{
					remove:{
						trigger:{global:'roundStart'},
						onremove:true,
						forced:true,
						locked:false,
						charlotte:true,
						filter:function(event,player){
							return player.getStorage('clanfangzhen_remove').contains(game.roundNumber);
						},
						content:function(){
							player.removeSkill('clanfangzhen');
						}
					}
				}
			},
			clanliuju:{
				audio:2,
				trigger:{player:'phaseUseEnd'},
				filter:function(event,player){
					return game.hasPlayer(current=>player.canCompare(current));
				},
				direct:true,
				content:function(){
					'step 0'
					player.chooseTarget(get.prompt('clanliuju'),'与一名其他角色拼点，输的角色可以使用任意张拼点牌中的非基本牌',(card,player,target)=>{
						return player.canCompare(target);
					}).set('ai',target=>{
						var player=_status.event.player;
						var ts=target.getCards('h').sort((a,b)=>get.number(a)-get.number(b));
						if(get.attitude(player,target)<0){
							var hs=player.getCards('h').sort((a,b)=>get.number(a)-get.number(b));
							if(!hs.length||!ts.length) return 0;
							if(get.type(hs[0],null,false)=='basic'&&get.value(hs[0])>6) return 0;
							if(get.number(hs[0])<get.number(ts[0])||get.type(hs[0],null,false)=='basic') return 1;
							return Math.random()-0.7;
						}
						return get.type(ts[0])!='basic';
					});
					'step 1'
					if(result.bool){
						var target=result.targets[0];
						event.target=target;
						player.logSkill('clanliuju',target);
						player.chooseToCompare(target).set('small',true);
					}
					else event.finish();
					'step 2'
					if(!result.tie){
						var loser=result.bool?target:player;
						var cards=[];
						game.getGlobalHistory('cardMove',evt=>{
							if(evt.getParent(2)==event) cards.addArray(evt.cards.filter(i=>{
								return get.position(i,true)=='d'&&get.type(i,null,false)!='basic';
							}));
						});
						event.loser=loser;
						event.distance=[get.distance(player,target),get.distance(target,player)];
						if(cards.length) event.cards=cards;
						else event.finish();
					}
					else event.finish();
					'step 3'
					var cardsx=cards.filter(i=>get.position(i,true)=='d'&&event.loser.hasUseTarget(i));
					if(!cardsx.length) event.goto(6);
					else event.loser.chooseButton(['留驹：是否使用其中的一张牌？',cardsx]).set('filterButton',button=>{
						return _status.event.player.hasUseTarget(button.link);
					}).set('ai',button=>{
						return _status.event.player.getUseValue(button.link)+0.1;
					});
					'step 4'
					if(result.bool){
						var card=result.links[0];
						event.cards.remove(card);
						event.loser.$gain2(card,false);
						game.delayx();
						event.loser.chooseUseTarget(true,card,false);
					}
					else event.goto(6);
					'step 5'
					if(cards.filter(i=>get.position(i,true)=='d'&&event.loser.hasUseTarget(i)).length) event.goto(3);
					'step 6'
					if(get.distance(player,target)!=event.distance[0]||get.distance(target,player)!=event.distance[1]){
						player.restoreSkill('clanxumin');
						game.log(player,'重置了','#g【恤民】');
					}
				}
			},
			clanxumin:{
				audio:2,
				audioname:['clan_hanshao','clan_hanrong'],
				enable:'phaseUse',
				viewAs:{name:'wugu'},
				filterCard:true,
				filterTarget:function(card,player,target){
					if(player==target) return false;
					return player.canUse(card,target);
				},
				selectTarget:[1,Infinity],
				check:function(card){
					return 6-get.value(card);
				},
				position:'he',
				limited:true,
				clanSkill:true,
				skillAnimation:true,
				animationColor:'soil',
				precontent:function(){
					player.logSkill('clanxumin');
					player.awakenSkill('clanxumin');
					delete event.result.skill;
				},
				ai:{
					order:7,
					result:{target:1}
				},
			},
			//族韩融
			//我们连和！（？）
			clanlianhe:{
				audio:2,
				trigger:{player:'phaseUseBegin'},
				filter:function(event,player){
					return game.hasPlayer(current=>!current.isLinked());
				},
				direct:true,
				content:function(){
					'step 0'
					player.chooseTarget(get.prompt2('clanlianhe'),2,(card,player,target)=>{
						return !target.isLinked();
					}).set('ai',target=>{
						var att=get.attitude(_status.event.player,target);
						if(att>0) att/=1.2;
						return Math.abs(att);
					});
					'step 1'
					if(result.bool){
						var targets=result.targets.sortBySeat();
						targets.forEach(i=>i.link(true));
						player.logSkill('clanlianhe',targets);
						player.addSkill('clanlianhe_effect');
						player.markAuto('clanlianhe_effect',targets);
					}
				},
				subSkill:{
					effect:{
						trigger:{global:['phaseUseEnd','die']},
						charlotte:true,
						forced:true,
						locked:false,
						popup:false,
						onremove:true,
						filter:function(event,player){
							return player.getStorage('clanlianhe_effect').contains(event.player);
						},
						marktext:'连',
						intro:{content:'已选择目标：$'},
						content:function(){
							'step 0'
							player.unmarkAuto('clanlianhe_effect',[trigger.player]);
							if(trigger.name=='die') event.finish();
							'step 1'
							if(trigger.player.hasHistory('gain',evt=>{
								return evt.getParent().name=='draw'&&evt.getParent('phaseUse')==trigger;
							})) event.finish();
							else{
								player.logSkill('clanlianhe_effect',trigger.player);
								var num=0;
								trigger.player.getHistory('gain',evt=>{
									if(evt.getParent('phaseUse')!=trigger) return false;
									num+=evt.cards.length;
								});
								num=Math.min(num,3);
								event.num=num;
								if(num<=1) event._result={bool:false};
								else{
									var pos=player==trigger.player?'e':'he';
									trigger.player.chooseCard('连和：交给'+get.translation(player)+get.cnNumber(num-1)+'张牌，或点“取消”令其摸'+get.cnNumber(num+1)+'张牌',true,num-1,pos).set('ai',card=>{
										if(_status.event.draw) return 0;
										return 5-get.value(card);
									}).set('draw',get.attitude(trigger.player,player)>=0);
								}
							}
							'step 2'
							if(result.bool){
								trigger.player.give(result.cards,player);
							}
							else player.draw(num+1);
						}
					}
				}
			},
			clanhuanjia:{
				audio:2,
				trigger:{player:'phaseUseEnd'},
				filter:function(event,player){
					return game.hasPlayer(current=>player.canCompare(current));
				},
				direct:true,
				content:function(){
					'step 0'
					player.chooseTarget(get.prompt('clanhuanjia'),'与一名其他角色拼点，赢的角色可以使用一张拼点牌。若此牌未造成过伤害，你获得另一张拼点牌，否则你失去一个技能',(card,player,target)=>{
						return player.canCompare(target);
					}).set('ai',target=>{
						var player=_status.event.player;
						if(get.attitude(player,target)<=0){
							var hs=player.getCards('h').sort((a,b)=>get.number(b)-get.number(a));
							var ts=target.getCards('h').sort((a,b)=>get.number(b)-get.number(a));
							if(!hs.length||!ts.length) return 0;
							if(get.number(hs[0])>get.number(ts[0])&&(!get.tag(hs[0],'damage')&&player.hasValueTarget(hs[0]))) return 1;
							return Math.random()-0.4;
						}
						return 0;
					});
					'step 1'
					if(result.bool){
						var target=result.targets[0];
						event.target=target;
						player.logSkill('clanhuanjia',target);
						player.chooseToCompare(target);
					}
					else event.finish();
					'step 2'
					if(!result.tie){
						var winner=result.bool?player:target;
						var cards=[];
						game.getGlobalHistory('cardMove',evt=>{
							if(evt.getParent(2)==event) cards.addArray(evt.cards.filterInD('d'));
						});
						event.winner=winner;
						if(cards.length) event.cards=cards;
						else event.finish();
					}
					else event.finish();
					'step 3'
					var cardsx=cards.filter(i=>get.position(i,true)=='d'&&event.winner.hasUseTarget(i));
					if(!cardsx.length) event.goto(6);
					else event.winner.chooseButton(['缓颊：是否使用其中的一张牌？',cardsx]).set('filterButton',button=>{
						return _status.event.player.hasUseTarget(button.link);
					}).set('ai',button=>{
						var damage=1;
						if(_status.event.att>2&&get.tag(button.link,'damage')) damage*=2;
						return _status.event.player.getUseValue(button.link)*damage+0.1;
					}).set('att',get.attitude(event.winner,player));
					'step 4'
					if(result.bool){
						var card=result.links[0];
						event.card=card;
						event.cards.remove(card);
						event.winner.$gain2(card,false);
						game.delayx();
						event.winner.chooseUseTarget(true,card,false);
					}
					'step 5'
					if(game.hasPlayer2(current=>{
						return current.hasHistory('sourceDamage',evt=>evt.cards&&evt.cards[0]==card);
					})){
						var skills=player.getSkills(null,false,false).filter(skill=>{
							var info=get.info(skill);
							if(!info||get.is.empty(info)||info.charlotte) return false;
							return true;
						});
						player.chooseControl(skills).set('choiceList',skills.map(i=>{
							return '<div class="skill">【'+get.translation(lib.translate[i+'_ab']||get.translation(i).slice(0,2))+'】</div><div>'+get.skillInfoTranslation(i,player)+'</div>';
						})).set('displayIndex',false).set('prompt','恤民：失去一个技能').set('ai',()=>{
							var choices=_status.event.controls.slice();
							var value=(skill)=>get.skillRank(skill,'in')+get.skillRank(skill,'out');
							choices=choices.map(skill=>[skill,value(skill)]);
							var list=choices.sort((a,b)=>a[1]-b[1])[0];
							if(list[1]<2) return list[0];
							else{
								if(_status.event.controls.contains('clanxumin')) return 'clanxumin';
								return list[0];
							}
						});
					}
					else{
						player.gain(cards,'gain2');
						event.finish();
					}
					'step 6'
					player.removeSkill(result.control);
					player.popup(result.control);
					game.log(player,'失去了技能','#g【'+get.translation(result.control)+'】');
				},
				ai:{
					expose:0.1,
				}
			},
			//族荀谌
			clansankuang:{
				audio:2,
				trigger:{player:'useCardAfter'},
				direct:true,
				forced:true,
				filter:function(event,player){
					var card=event.card,type=get.type2(card);
					for(var i=player.actionHistory.length-1; i>=0; i--){
						var history=player.actionHistory[i].useCard;
						for(var evt of history){
							if(evt==event) continue;
							if(get.type2(evt.card)==type) return false;
						}
						if(player.actionHistory[i].isRound) break;
					}
					return true;
				},
				getNum:function(player){
					return (player.countCards('ej')>0)+(player.isDamaged())+(Math.max(0,player.hp)<player.countCards('h'));
				},
				content:function(){
					'step 0'
					player.chooseTarget('三恇：选择一名其他角色','令其交给你至少X张牌，然后其获得'+get.translation(trigger.cards.filterInD('ejod'))+'（X为以下条件中其满足的项数：场上有牌、已受伤、体力值小于手牌数）',true,lib.filter.notMe).set('ai',target=>{
						var att=get.attitude(player,target);
						if(_status.event.goon) return -att;
						return -Math.sqrt(Math.abs(att))-lib.skill.clansankuang.getNum(target);
					}).set('goon',Math.max.apply(Math,trigger.cards.map(i=>get.value(i)))<=5||trigger.cards.filterInD('ejod').length==0)
					'step 1'
					if(result.bool){
						var target=result.targets[0],num=lib.skill.clansankuang.getNum(target),num2=target.countCards('he');
						event.target=target;
						player.logSkill('clansankuang',target);
						if(num2==0) event._result={bool:false};
						else if(num2<=num) event._result={bool:true,cards:target.getCards('he')};
						else target.chooseCard('he',true,[num,Infinity]).set('ai',get.unuseful);
					}else event.finish();
					'step 2'
					if(result.bool){
						var cards=result.cards;
						target.give(cards,player);
						game.delayx();
					}
					'step 3'
					if(trigger.cards.filterInD('ej').length) target.gain(trigger.cards.filterInD('ej'),get.owner(trigger.cards.filterInD('ej')[0]),'giveAuto','bySelf');
					else if(trigger.cards.filterInD('od').length) target.gain(trigger.cards.filterInD('od'),'gain2','bySelf');
				},
				ai:{
					reverseOrder:true,
					skillTagFilter:function(player){
						if(player.getHistory('useCard',evt=>get.type(evt.card)=='equip').length>0) return false;
					},
					effect:{
						target:function(card,player,target){
							if(player==target&&get.type(card)=='equip'&&!player.getHistory('useCard',evt=>get.type(evt.card)=='equip').length==0) return [1,3];
						},
					},
					threaten:1.6,
				},
			},
			clanbeishi:{
				audio:2,
				trigger:{
					global:['loseAfter','equipAfter','addJudgeAfter','gainAfter','loseAsyncAfter','addToExpansionAfter'],
				},
				forced:true,
				filter:function(event,player){
					var history=player.getAllHistory('useSkill',evt=>evt.skill=='clansankuang');
					if(!history.length) return false;
					var target=history[0].targets[0];
					if(target.countCards('h')) return false;
					var evt=event.getl(target);
					return evt&&evt.hs&&evt.hs.length;
				},
				content:function(){
					player.recover();
				}
			},
			//族荀淑
			clanshenjun:{
				audio:2,
				trigger:{
					global:'useCard',
				},
				forced:true,
				locked:false,
				filter:function(event,player){
					return (event.card.name=='sha'||get.type(event.card)=='trick')&&player.countCards('h',event.card.name)>0;
				},
				content:function(){
					var cards=player.getCards('h',trigger.card.name);
					player.showCards(cards,get.translation(player)+'发动了【神君】');
					player.addGaintag(cards,'clanshenjun');
					for(var name of lib.phaseName){
						var evt=_status.event.getParent(name);
						if(!evt||evt.name!=name) continue;
						player.addTempSkill('clanshenjun_viewAs',name+'After');
						break;
					}
				},
				subSkill:{
					viewAs:{
						trigger:{global:['phaseZhunbeiEnd','phaseJudgeEnd','phaseDrawEnd','phaseUseEnd','phaseDiscardEnd','phaseJieshuEnd']},
						filter:function(event,player){
							return player.countCards('h',card=>card.hasGaintag('clanshenjun'))>0;
						},
						forced:true,
						charlotte:true,
						content:function(){
							'step 0'
							var cards=player.getCards('h',card=>card.hasGaintag('clanshenjun'));
							var list=[],names=[];
							for(var card of cards){
								var name=get.name(card),nature=get.nature(card);
								var namex=name+(nature?nature:'');
								if(names.contains(namex)) continue;
								if(nature) list.push([get.type(card),'',name,nature]);
								else list.push([get.type(card),'',name]);
								names.push(namex);
							}
							list.sort((a,b)=>{
								return 100*(lib.inpile.indexOf(a[2])-lib.inpile.indexOf(b[2]))+lib.inpile_nature.indexOf(a[3])-lib.inpile_nature.indexOf(b[3]);
							})
							player.chooseButton(['是否将'+get.cnNumber(cards.length)+'张牌当下列一张牌使用？',[list,'vcard']]).set('ai',function(button){
								return _status.event.player.getUseValue({name:button.link[2],nature:button.link[3]});
							});
							'step 1'
							if(result.bool){
								var name=result.links[0][2],nature=result.links[0][3];
								var cards=player.getCards('h',card=>card.hasGaintag('clanshenjun'));
								game.broadcastAll(function(num,card){
									lib.skill.clanshenjun_backup.selectCard=num;
									lib.skill.clanshenjun_backup.viewAs=card;
								},cards.length,{name:name,nature:nature});
								var next=player.chooseToUse();
								next.set('openskilldialog','将'+get.cnNumber(cards.length)+'张牌当做'+(nature?get.translation(nature):'')+'【'+get.translation(name)+'】使用');
								next.set('norestore',true);
								next.set('addCount',false);
								next.set('_backupevent','clanshenjun_backup');
								next.set('custom',{
									add:{},
									replace:{window:function(){}}
								});
								next.backup('clanshenjun_backup');
							}
						}
					},
					backup:{
						filterCard:function(card){
							return get.itemtype(card)=='card';
						},
						position:'hes',
						filterTarget:lib.filter.targetEnabled,
						check:(card)=>6-get.value(card),
						log:false,
						precontent:function(){
							delete event.result.skill;
						},
					}
				}
			},
			clanbalong:{
				audio:2,
				trigger:{
					player:['damageEnd','recoverEnd','loseHpEnd'],
				},
				forced:true,
				filter:function(event,player){
					if(game.getGlobalHistory('changeHp',evt=>evt.player==player&&evt.getParent()==event).length!=1) return false;
					var cards=player.getCards('h'),map={};
					if(!cards.length) return false;
					for(var card of cards){
						var type=get.type2(card);
						if(typeof map[type]!='number') map[type]=0;
						map[type]++;
					}
					var list=[];
					for(var i in map){
						if(map[i]>0) list.push([i,map[i]]);
					}
					list.sort((a,b)=>b[1]-a[1]);
					return list[0][0]=='trick'&&(list.length==1||list[0][1]>list[1][1]);
				},
				content:function(){
					player.showHandcards(get.translation(player)+'发动了【八龙】');
					player.drawTo(game.countPlayer());
				}
			},
			//族荀粲
			clanyunshen:{
				audio:2,
				enable:'phaseUse',
				usable:1,
				filterTarget:function(card,player,target){
					return player!=target&&target.isDamaged();
				},
				content:function(){
					'step 0'
					target.recover();
					'step 1'
					var name=get.translation(target);
					player.chooseControl().set('choiceList',[name+'视为对你使用一张冰【杀】','你视为对'+name+'使用一张冰【杀】']).set('prompt','熨身：请选择一项').set('ai',()=>_status.event.choice).set('choice',function(){
						var card={name:'sha',nature:'ice',isCard:true};
						var eff=get.effect(player,card,target,player),eff2=get.effect(target,card,player,player);
						if(eff>eff2) return '选项一';
						else return '选项二';
					}());
					'step 2'
					var players=[target,player];
					if(result.control=='选项二') players.reverse();
					var card={name:'sha',nature:'ice',isCard:true};
					if(players[0].canUse(card,players[1],false)) players[0].useCard(card,players[1],false,'noai');
				},
				ai:{
					order:2,
					expose:0.2,
					result:{
						target:function(player,target){
							var eff=get.recoverEffect(target,player,player);
							if(eff>0) return 1;
							else if(get.effect(target,{name:'sha',nature:'ice',isCard:true},player,player)>eff) return -1;
							return 0;
						}
					}
				}
			},
			clanshangshen:{
				audio:2,
				trigger:{global:'damageEnd'},
				filter:function(event,player){
					if(!event.nature) return false;
					return game.countPlayer2(current=>{
						return current.hasHistory('damage',evt=>{
							return evt.nature&&evt!=event;
						});
					})==0;
				},
				logTarget:'player',
				check:function(event,player){
					if(get.attitude(player,event.player)<=2) return false;
					if(event.player.countCards('h')>=4) return false;
					return true;
				},
				content:function(){
					'step 0'
					event.judgestr=get.translation('shandian');
					player.judge(lib.card.shandian.judge,event.judgestr).judge2=lib.card.shandian.judge2;
					game.delayx(1.5);
					'step 1'
					var name='shandian';
					if(event.cancelled&&!event.direct){
						if(lib.card[name].cancel){
							var next=game.createEvent(name+'Cancel');
							next.setContent(lib.card[name].cancel);
							next.cards=[];
							next.card=get.autoViewAs({name:name});
							next.player=player;
						}
					}
					else{
						var next=game.createEvent(name);
						next.setContent(function(){
                            if(result.bool==false){
                                player.damage(3,'thunder','nosource');
                            }
                        });
						next._result=result;
						next.cards=[];
                        next.card=get.autoViewAs({name:name});
						next.player=player;
					}
                    'step 2'
					trigger.player.drawTo(4);
				},
				ai:{expose:0.25}
			},
			clanfenchai:{
				audio:2,
				init:function(player){
					if(player.getStorage('clanfenchai').length>0) return;
					var history=player.getHistory('useSkill',evt=>{
						if(evt.type!='player') return false;
						var skill=evt.sourceSkill||evt.skill,targets=evt.targets;
						var info=get.info(skill);
						if(!info||info.charlotte) return false;
						if(targets&&targets.length){
							if(targets.filter(i=>player.differentSexFrom(i)).length>0) return true;
						}
						return false;
					});
					if(history.length){
						var evt=history[0],targets=evt.targets;
						player.markAuto('clanfenchai',targets.filter(i=>player.differentSexFrom(i)));
					}
				},
				trigger:{
					player:['logSkill','useSkillAfter'],
				},
				forced:true,
				silent:true,
				onremove:true,
				marktext:'钗',
				intro:{
					content:(storage,player)=>'对象：'+get.translation(storage),
				},
				group:'clanfenchai_audio',
				filter:function(event,player){
					if(event.type!='player') return false;
					var targets=event.targets;
					if(!targets||!targets.length) return false;
					var info=get.info(event.sourceSkill||event.skill);
					if(!info||info.charlotte) return false;
					if(player.getStorage('clanfenchai').length!=0) return false;
					return targets.filter(i=>player.differentSexFrom(i)).length>0;
				},
				content:function(){
					player.markAuto('clanfenchai',trigger.targets.filter(i=>player.differentSexFrom(i)));
				},
				subSkill:{
					audio:{
						audio:'clanfenchai',
						forced:true,
						trigger:{player:'judge'},
						filter:function(event,player){
							return player.getStorage('clanfenchai').length;
						},
						content:function(){}
					}
				},
				mod:{
					suit:function(card,suit){
						var player=get.owner(card)||_status.event.player;
						if(!player||!player.judging||player.judging[0]!=card) return;
                        var storage=player.getStorage('clanfenchai');
                        if(!storage.length) return;
						return storage.filter(i=>i.isIn()).length>0?'heart':'spade';
					}
				}
			},
			//族荀采
			clanlieshi:{
				audio:2,
				enable:'phaseUse',
				filter:function(event,player){
					return !player.storage._disableJudge||player.countCards('h',card=>['sha','shan'].contains(get.name(card)))>0;
				},
				chooseButton:{
					dialog:function(event,player){
						var dialog=ui.create.dialog('烈誓：选择一项','hidden');
						dialog.add([lib.skill.clanlieshi.choices.slice(),'textbutton']);
						return dialog;
					},
					filter:function(button,player){
						var link=button.link;
						if(link=='damage') return !player.storage._disableJudge;
						var num=player.countCards('h',link);
						return num>0&&num==player.getDiscardableCards(player,'h').filter(i=>get.name(i)==link).length;
					},
					check:function(button){
						var player=_status.event.player;
						switch (button.link){
							case 'damage':
								if(get.damageEffect(player,player,player,'fire')>=0) return 10;
								if(player.hp>=Math.max(2,3-player.getFriends().length)&&game.countPlayer(current=>get.attitude(player,current)<0&&current.countCards('h',card=>['sha','shan'].contains(get.name(card))))) return 0.8+Math.random();
								return 0;
							case 'shan':
								if(player.countCards('h','shan')==1) return 8+Math.random();
								return 1+Math.random();
							case 'sha':
								if(player.countCards('h','sha')==1) return 8+Math.random();
								return 0.9+Math.random();
						}
					},
					backup:function(links){
						var next=get.copy(lib.skill['clanlieshi_backupx']);
						next.choice=links[0];
						return next;
					},
					prompt:function(links){
						if(links[0]=='damage') return '废除判定区并受到1点火焰伤害';
						return '弃置所有【'+get.translation(links[0])+'】';
					},
				},
				choices:[
					['damage','废除判定区并受到1点火焰伤害'],
					['shan','弃置所有【闪】'],
					['sha','弃置所有【杀】'],
				],
				ai:{
					order:function(item,player){
						if(!player) return;
						var eff=get.damageEffect(player,player,player,'fire'),disabled=!player.storage._disableJudge;
						if((player.countCards('h','sha')==1||player.countCards('h','shan')==1)&&eff<0&&!disabled) return 8;
						else if(eff>=0&&!disabled) return 5.8;
						if(!disabled&&!player.countCards('h',card=>['sha','shan'].contains(get.name(card)))){
							if((!player.hasSkill('clanhuanyin')||!player.canSave(player))&&player.hp<=1) return 0;
							if(player.canSave(player)&&player.hp==1&&player.countCards('h')<=1) return 2.6;
							if(player.hp<Math.max(2,3-player.getFriends().length)||!game.countPlayer(current=>get.attitude(player,current)<0&&current.countCards('h',card=>['sha','shan'].contains(get.name(card))))) return 0;
						}
						return 2.5;
					},
					expose:0.2,
					result:{player:1},
				},
				subSkill:{
					backup:{},
					backupx:{
						audio:'clanlieshi',
						selectCard:-1,
						selectTarget:-1,
						filterCard:()=>false,
						filterTarget:()=>false,
						multitarget:true,
						content:function(){
							'step 0'
							var choice=lib.skill.clanlieshi_backup.choice;
							event.choice=choice;
							if(choice=='damage'){
								player.damage('fire');
								if(!player.storage._disableJudge) player.disableJudge();
							}else{
								var cards=player.getCards('h',choice);
								if(cards.length) player.discard(cards);
							}
							'step 1'
							if(!player.isIn()) event.finish();
							else player.chooseTarget('烈誓：令一名其他角色选择另一项',lib.filter.notMe,true).set('ai',target=>{
								var player=_status.event.player,chosen=_status.event.getParent().choice,att=get.attitude(player,target);
								if(chosen=='damage'){
									if(att>0) return 0;
									return -att/2+target.countCards('h',card=>['sha','shan'].contains(get.name(card)));
								}
								return get.damageEffect(target,player,player,'fire');
							});
							'step 2'
							if(result.bool){
								var target=result.targets[0];
								event.target=target;
								player.line(target,'fire');
								var list=[],choice=event.choice;
								var choiceList=lib.skill.clanlieshi.choices.slice();
								choiceList=choiceList.map((link,ind,arr)=>{
									link=link[1];
									var ok=true;
									if(arr[ind][0]==choice){
										link+='（'+get.translation(player)+'已选）';
										ok=false;
									}
									if(ind==0){
										if(target.storage._disableJudge) ok=false;
									}
									else if(ind>0){
										var name=ind==1?'shan':'sha';
										if(!target.countCards('h',name)) ok=false;
									}
									if(!ok) link='<span style="opacity:0.5">'+link+'</span>';
									else list.push('选项'+get.cnNumber(ind+1,true));
									return link;
								});
								if(!list.length){event.finish(); return;}
								target.chooseControl(list).set('choiceList',choiceList).set('ai',()=>{
									var controls=_status.event.controls.slice(),player=_status.event.player,user=_status.event.getParent().player;
									if(controls.length==1) return controls[0];
									if(controls.contains('选项一')&&get.damageEffect(player,user,player,'fire')>=0) return '选项一';
									if(controls.contains('选项一')&&player.hp<=2&&player.countCards('h',card=>['sha','shan'].contains(get.name(card)))<=3) controls.remove('选项一');
									if(controls.length==1) return controls[0];
									if(player.getCards('h','sha').reduce((p,c)=>p+get.value(c,player),0)>player.getCards('h','sha').reduce((p,c)=>p+get.value(c,player),0)){
										if(controls.contains('选项三')) return '选项三';
									}
									else if(controls.contains('选项二')) return '选项二';
									return controls.randomGet();
								});
							} else event.finish();
							'step 3'
							if(result.control=='选项一'){
								if(!target.storage._disableJudge) target.disableJudge();
								target.damage('fire');
							}
							else{
								var cards=target.getCards('h',result.control=='选项二'?'shan':'sha');
								if(cards.length) target.discard(cards);
							}
						}
					}
				}
			},
			clandianzhan:{
				audio:2,
				trigger:{player:'useCardAfter'},
				forced:true,
				filter:function(event,player){
					if(!lib.suit.contains(get.suit(event.card))) return false;
					var card=event.card,suit=get.suit(card);
					for(var i=player.actionHistory.length-1; i>=0; i--){
						var history=player.actionHistory[i].useCard;
						for(var evt of history){
							if(evt==event) continue;
							if(get.suit(evt.card)==suit) return false;
						}
						if(player.actionHistory[i].isRound) break;
					}
					return event.targets&&event.targets.length==1&&(!event.targets[0].isLinked()||
						player.getCards('h',card=>get.suit(card)==get.suit(event.card)).filter(card=>{
							var mod=game.checkMod(card,player,'unchanged','cardChongzhuable',player);
							if(mod!='unchanged') return true;
							return false;
						}).length==0);
				},
				content:function(){
					'step 0'
					if(trigger.targets&&trigger.targets.length==1){
						trigger.targets[0].link(true);
					}
					var cards=player.getCards('h',card=>get.suit(card)==get.suit(trigger.card));
					if(cards.length>0){
						player.loseToDiscardpile(cards);
						player.draw(cards.length);
					}
					'step 1'
					player.draw();
				}
			},
			clanhuanyin:{
				audio:2,
				trigger:{player:'dying'},
				forced:true,
				check:()=>true,
				filter:function(event){
					return event.player.countCards('h')<4;
				},
				content:function(){
					player.drawTo(4);
				}
			},
			clandaojie:{
				audio:2,
				audioname:['clan_xunshu','clan_xunchen','clan_xuncai','clan_xuncan'],
				trigger:{player:'useCardAfter'},
				filter:function(event,player){
					return player.getHistory('useCard',evt=>{
						return get.type(evt.card)=='trick'&&!get.tag(evt.card,'damage');
					}).indexOf(event)==0;
				},
				forced:true,
				clanSkill:true,
				content:function(){
					'step 0'
					var skills=player.getSkills(null,false,false).filter(skill=>{
						var info=get.info(skill);
						if(!info||info.charlotte||!get.is.locked(skill)||get.skillInfoTranslation(skill,player).length==0) return false;
						return true;
					});
					player.chooseControl(skills,'cancel2').set('choiceList',skills.map(i=>{
						return '<div class="skill">【'+get.translation(lib.translate[i+'_ab']||get.translation(i).slice(0,2))+'】</div><div>'+get.skillInfoTranslation(i,player)+'</div>';
					})).set('displayIndex',false).set('prompt','蹈节：失去一个锁定技，或点“取消”失去1点体力').set('ai',()=>{
						var player=_status.event.player,choices=_status.event.controls.slice();
						var negs=choices.filter(i=>{
							var info=get.info(i);
							if(!info||!info.ai) return false;
							return info.ai.neg||info.ai.halfneg;
						});
						if(negs.length) return negs.randomGet();
						if(get.effect(player,{name:'losehp'},player,player)>=0) return 'cancel2';
						if(player.hp>3) return 'cancel2';
						return Math.random()<0.75?'clandaojie':choices.randomGet();
					});
					'step 1'
					if(result.control!='cancel2'){
						player.removeSkill(result.control);
						player.popup(result.control);
						game.log(player,'失去了技能','#g【'+get.translation(result.control)+'】');
					}
					else{
						player.loseHp();
					}
					'step 2'
					var targets=game.filterPlayer(current=>current==player||current.hasClan('颍川荀氏'));
					if(targets.length==1) event._result={bool:true,targets:targets};
					else player.chooseTarget('蹈节：将'+get.translation(trigger.cards.filterInD())+'交给一名颍川荀氏角色',true,(card,player,target)=>{
						return target==player||target.hasClan('颍川荀氏')
					}).set('ai',target=>get.attitude(_status.event.player,target));
					'step 3'
					if(result.bool){
						var target=result.targets[0];
						player.line(target,'green');
						target.gain(trigger.cards.filterInD(),player,'gain2');
					}
				},
			},
			//族吴班
			clanzhanding:{
				audio:2,
				enable:'chooseToUse',
				viewAsFilter:function(player){
					return player.countCards('hes')>0;
				},
				viewAs:{name:'sha'},
				filterCard:true,
				position:'hes',
				selectCard:[1,Infinity],
				check:function(card){
					return 6-ui.selected.cards.length-get.value(card);
				},
				onuse:function(links,player){
					player.addTempSkill('clanzhanding_effect');
				},
				ai:{
					order:1,
					respondSha:true,
					skillTagFilter:function(player){
						return player.countCards('hes')>0;
					},
				},
				subSkill:{
					effect:{
						trigger:{player:'useCardAfter'},
						forced:true,
						popup:false,
						filter:function(event,player){
							return event.skill=='clanzhanding';
						},
						content:function(){
							lib.skill.chenliuwushi.change(player,-1);
							if(player.hasHistory('sourceDamage',function(evt){
								return evt.card==trigger.card;
							})){
								var num1=player.countCards('h'),num2=player.getHandcardLimit();
								if(num1<num2) player.draw(Math.min(5,num2-num1));
							}
							else if(trigger.addCount!==false){
								trigger.addCount=false;
								player.getStat().card.sha--;
							}
						},
					},
				},
			},
			//族吴苋
			clanyirong:{
				audio:2,
				enable:'phaseUse',
				usable:2,
				filter:function(event,player){
					var num1=player.countCards('h'),num2=player.getHandcardLimit();
					return num1!=num2;
				},
				selectCard:function(){
					var player=_status.event.player;
					var num1=player.countCards('h'),num2=player.getHandcardLimit();
					if(num1>num2) return num1-num2;
					return [0,1];
				},
				filterCard:function(card,player){
					var num1=player.countCards('h'),num2=player.getHandcardLimit();
					return num1>num2;
				},
				check:function(card){
					var player=_status.event.player;
					if(player.countCards('h',function(card){
						return lib.skill.clanyirong.checkx(card)>0;
					})+1<(player.countCards('h')-player.getHandcardLimit())) return 0;
					return lib.skill.clanyirong.checkx(card);
				},
				checkx:function(card){
					var num=1;
					if(_status.event.player.getUseValue(card,null,true)<=0) num=1.5;
					return (15-get.value(card))*num;
				},
				prompt:function(){
					var player=_status.event.player;
					var num1=player.countCards('h'),num2=player.getHandcardLimit();
					var str='<span class="text center">';
					if(num1>num2){
						str+=('弃置'+get.cnNumber(num1-num2)+'张牌，然后手牌上限+1。')
					}
					else{
						str+=('摸'+get.cnNumber(Math.min(5,num2-num1))+'张牌，然后手牌上限-1。');
					}
					str+=('<br>※当前手牌上限：'+num2);
					var num3=player.countMark('clanguixiang_count');
					if(num3>0){
						str+=('；阶段数：'+num3)
					}
					str+='</span>';
					return str;
				},
				content:function(){
					'step 0'
					if(cards.length){
						lib.skill.chenliuwushi.change(player,1);
						event.finish();
					}
					else{
						var num1=player.countCards('h'),num2=player.getHandcardLimit();
						if(num1<num2) player.draw(Math.min(5,num2-num1));
					}
					'step 1'
					lib.skill.chenliuwushi.change(player,-1);
				},
				ai:{
					order:function(item,player){
						var num=player.getHandcardLimit(),numx=player.countMark('clanguixiang_count');
						if(num==5&&numx==4&&player.getStat('skill').clanyirong) return 0;
						if(player.countCards('h')==num+1&&num!=2&&(num<=4||num>4&&numx>4)) return 10;
						return 0.5;
					},
					result:{player:1},
					threaten:5,
				},
			},
			clanguixiang:{
				audio:2,
				init:function(player){
					player.addSkill('clanguixiang_count');
				},
				onremove:function(player){
					player.removeSkill('clanguixiang_count');
					var event=_status.event.getParent('phase');
					if(event) delete event._clanguixiang;
				},
				trigger:{
					player:['phaseZhunbeiBefore','phaseJudgeBefore','phaseDrawBefore','phaseDiscardBefore','phaseJieshuBefore'],
				},
				forced:true,
				filter:function(event,player){
					var evt=event.getParent('phase');
					if(!evt||!evt._clanguixiang) return false;
					var num1=player.getHandcardLimit()-1,num2=player.countMark('clanguixiang_count');
					return num1==num2;
				},
				content:function(){
					trigger.cancel(null,null,'notrigger');
					var next=player.phaseUse();
					event.next.remove(next);
					trigger.getParent().next.unshift(next);
				},
				subSkill:{
					count:{
						trigger:{
							player:['phaseZhunbeiBegin','phaseJudgeBegin','phaseDrawBegin','phaseDiscardBegin','phaseJieshuBegin','phaseUseBegin'],
						},
						forced:true,
						popup:false,
						lastDo:true,
						priority:-Infinity,
						content:function(){
							player.addMark('clanguixiang_count',1,false);
						},
						group:'clanguixiang_clear',
					},
					clear:{
						trigger:{player:'phaseBefore'},
						forced:true,
						charlotte:true,
						popup:false,
						firstDo:true,
						priority:Infinity,
						content:function(){
							delete player.storage.clanguixiang_count;
							trigger._clanguixiang=true;
						},
					},
				},
			},
			clanmuyin:{
				audio:2,
				clanSkill:true,
				audioname:['clan_wuxian','clan_wuban'],
				trigger:{player:'phaseZhunbeiBegin'},
				isMax:function(player){
					var num=player.getHandcardLimit();
					return !game.hasPlayer(function(current){
						return current!=player&&current.getHandcardLimit()>num;
					});
				},
				filter:function(event,player){
					return game.hasPlayer(function(current){
						return (current==player||current.hasClan('陈留吴氏'))&&!lib.skill.clanmuyin.isMax(current);
					});
				},
				direct:true,
				content:function(){
					'step 0'
					player.chooseTarget(get.prompt('clanmuyin'),'令一名陈留吴氏角色的手牌上限+1',function(card,player,current){
						return (current==player||current.hasClan('陈留吴氏'))&&!lib.skill.clanmuyin.isMax(current);
					}).set('ai',function(target){
						return get.attitude(_status.event.player,target);
					});
					'step 1'
					if(result.bool){
						var target=result.targets[0];
						player.logSkill('clanmuyin',target);
						lib.skill.chenliuwushi.change(target,1);
						game.delayx();
					}
				},
			},
			chenliuwushi:{
				charlotte:true,
				change:function(player,num){
					player.addSkill('chenliuwushi');
					var info=player.storage;
					if(typeof info.chenliuwushi!='number') info.chenliuwushi=0;
					info.chenliuwushi+=num;
					if(info.chenliuwushi==0) player.unmarkSkill('chenliuwushi');
					else player.markSkill('chenliuwushi');
					if(num>=0) game.log(player,'的手牌上限','#y+'+num);
					else game.log(player,'的手牌上限','#g'+num);
				},
				mod:{
					maxHandcard:function(player,num){
						var add=player.storage.chenliuwushi;
						if(typeof add=='number') return num+add;
					},
				},
				markimage:'image/card/handcard.png',
				intro:{
					content:function(num,player){
						var str='<li>手牌上限';
						if(num>=0) str+='+';
						str+=num;
						str+='<br><li>当前手牌上限：';
						str+=player.getHandcardLimit();
						return str;
					},
				},
			},
		},
		characterReplace:{
			wuban:['clan_wuban','wuban'],
		},
		characterIntro:{
			xunshu:'荀淑（83年～149年），字季和，为郎陵侯相，颍川颍阴人（今河南省许昌市）人。汉和帝至汉桓帝时人物，以品行高洁著称。有子八人，号八龙。年轻时有高尚的德行，学问渊博，不喜欢雕章琢句，徒在文字上用功，不注重实际的学识。因此，常常被俗儒看不起。但州里却称他有知人之明。安帝时，征召任为郎中，后来再升当涂长。离职还乡里。他的孙子荀彧是曹操部下著名的谋士。',
			xuncai:'荀采（生卒年不详），字女荀，颍川人，东汉名士荀爽之女。荀采聪慧敏捷而有才艺。十七岁时，荀采嫁给阴瑜。两年后阴瑜去世。荀采不愿意改嫁，但荀爽答应把荀采嫁给同郡人郭奕。荀采趁着旁人没有防备，用粉在门上写下：“尸还阴”，而后自缢而死。',
			xuncan:'荀粲（210年—238年），字奉倩，颍川郡颍阴县（今河南省许昌市）人。三国时期曹魏大臣、玄学家，太尉荀彧幼子。个性简贵，不轻易交接常人，所交之辈皆一时俊杰。聪颖过人，善谈玄理，名噪一时。娶大将军曹洪之女为妻，生活美满。景初二年，面对妻子去世，悲痛过度而死，时年二十九，成语“荀令伤神”与之有关。',
			hanshao:'韩韶（生卒年不详），字仲黄，颍川舞阳（今河南省漯河市）人，东汉桓帝时出仕。任郡吏，有政绩，继而被征入司徒府。他公正廉明，尽心民事，视民苦如在己身，政绩卓著。汉永寿二年（公元156年），泰山贼公孙举率流寇数千骚扰嬴县，守令因不能拒敌安民，多受制裁，朝廷命尚书府从三府（司徒、司马、司空）属员中，选择能治理民事，又能拒寇入侵的官员，前往镇守。韩韶被封为“嬴长”到嬴县上任，他是莱芜历史上唯一的一位“嬴长”。',
			hanrong:'韩融（127年～196年），字元长，颍川舞阳（今属河南省漯河市）人。赢长韩韶子，献帝时大臣。中平五年（188年），融与荀爽、陈纪等十四人并博士征，不至。董卓废立，融等复俱公车征。初平元年（190年）六月，融为大鸿胪，奉命与执金吾胡母班等出使关东。献帝东迁，为李傕、郭汜等所败，融为太仆，奉命至弘农与傕、汜连和，使其放遣公卿百官及宫女妇人。',
		},
		translate:{
			clan_wuxian:'族吴苋',
			clanyirong:'移荣',
			clanyirong_info:'出牌阶段限两次。若你的手牌数：小于X，则你可以将手牌摸至X张（至多摸五张），然后X-1；大于X，则你可以将手牌弃置至X张，然后X+1。（X为你的手牌上限）',
			clanguixiang:'贵相',
			clanguixiang_info:'锁定技。你的非出牌阶段开始前，若此阶段即将成为你本回合内的第X个阶段（X为你的手牌上限），则你终止此阶段，改为进行一个出牌阶段。',
			clanmuyin:'穆荫',
			clanmuyin_info:'宗族技。准备阶段，你可以选择一名手牌上限不为全场最多的陈留吴氏角色。该角色的手牌上限+1。',
			chenliuwushi:'陈留·吴氏',
			clan_wuban:'族吴班',
			clanzhanding:'斩钉',
			clanzhanding_info:'你可以将任意张牌当做【杀】使用。你以此法使用的【杀】结算结束后，你令你的手牌上限-1，然后若你因此【杀】造成过伤害，则你将手牌摸至手牌上限（至多摸五张），否则你令此【杀】不计入次数限制。',
			clan_xunshu:'族荀淑',
			clanshenjun:'神君',
			clanshenjun_info:'当一名角色使用【杀】或普通锦囊牌时，若你手牌中有该牌名的牌，你展示之，且这些牌称为“神君”。然后本阶段结束时，你可以将等同于你“神君”数张牌当做一张“神君”牌使用。',
			clanbalong:'八龙',
			clanbalong_info:'锁定技。当你回复体力后或受到伤害后或失去体力后，若你手牌中唯一最多的类别为锦囊牌，你展示所有手牌并摸至角色数张。',
			clandaojie:'蹈节',
			clandaojie_info:'宗族技，锁定技。当你每回合第一次使用非伤害类普通锦囊牌后，你须失去一个锁定技或失去1点体力，令一名颍川荀氏角色获得此牌对应的所有实体牌。',
			clan_xuncai:'族荀采',
			clanlieshi:'烈誓',
			clanlieshi_info:'出牌阶段，你可以选择一项：1.废除判定区并受到你造成的1点火焰伤害；2.弃置所有【闪】；3.弃置所有【杀】。然后令一名其他角色从你未选择的选项中选择一项。',
			clandianzhan:'点盏',
			clandianzhan_info:'锁定技。当你每轮第一次使用一种花色的牌后：若此牌的目标数为1，你横置此牌目标；若你有此花色的手牌，你重铸这些牌。然后你摸一张牌。',
			clanhuanyin:'还阴',
			clanhuanyin_info:'锁定技。当你进入濒死状态时，将手牌补至四张。',
			clan_xunchen:'族荀谌',
			clansankuang:'三恇',
			clansankuang_info:'锁定技。当你每轮第一次使用一种类别的牌后，你令一名其他角色交给你至少X张牌，然后于场上或弃牌堆内或处理区内获得你使用的牌对应的所有实体牌（X为以下条件中其满足的项数：场上有牌、已受伤、体力值小于手牌数）。',
			clanbeishi:'卑势',
			clanbeishi_info:'锁定技。当一名角色失去最后的手牌后，若其是你首次发动〖三恇〗的目标角色，你回复1点体力。',
			clan_xuncan:'族荀粲',
			clanyunshen:'熨身',
			clanyunshen_info:'出牌阶段限一次。你可以令一名其他角色回复1点体力，然后选择一项：1.你视为对其使用一张冰【杀】；2.其视为对你使用一张冰【杀】。',
			clanshangshen:'伤神',
			clanshangshen_info:'当一名角色受到属性伤害后，若本回合此前没有角色或已死亡的角色受到过属性伤害，你可以进行目标角色为你的【闪电】的特殊的使用流程，然后其将手牌摸至四张。',
			clanfenchai:'分钗',
			clanfenchai_info:'锁定技。若你首次发动技能指定的异性目标角色中：存在存活角色，你的判定牌视为♥；不存在存活角色，你的判定牌视为♠。',
			clan_hanshao:'族韩韶',
			clanfangzhen:'放赈',
			clanfangzhen_info:'出牌阶段开始时，你可以横置一名角色并选择一项：1.摸两张牌，然后交给其两张牌；2.令其回复1点体力。然后第X轮游戏开始时，你失去〖放赈〗（X为其座位号）。',
			clanliuju:'留驹',
			clanliuju_info:'出牌阶段结束时，你可以与一名角色A拼点，输的角色可以使用任意张拼点牌中的非基本牌。然后若你至A的距离或A至你的距离发生了变化，你重置〖恤民〗。',
			clanxumin:'恤民',
			clanxumin_info:'宗族技，限定技。你可以将一张牌当做【五谷丰登】对任意名其他角色使用。',
			clan_hanrong:'族韩融',
			clanlianhe:'连和',
			clanlianhe_info:'出牌阶段开始时，你可以横置两名角色。这些角色于自己的下个出牌阶段结束时，若其此阶段未摸牌，其令你摸X+1张牌或交给你X-1张牌（X为其此阶段获得的牌数且至多为3）。',
			clanhuanjia:'缓颊',
			clanhuanjia_info:'出牌阶段结束时，你可以与一名角色拼点。赢的角色可以使用一张拼点牌。然后若此牌：未造成过伤害，你获得另一张拼点牌；造成过伤害，你失去一个技能。',
			
			clan_wu:'陈留·吴氏',
			clan_xun:'颍川·荀氏',
			clan_han:'颍川·韩氏',
		},
	};
});
