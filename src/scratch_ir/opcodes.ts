export const OPCODE_MOTION_MOVESTEPS = 'motion_movesteps'
export const OPCODE_MOTION_TURNRIGHT = 'motion_turnright'
export const OPCODE_MOTION_TURNLEFT = 'motion_turnleft'
export const OPCODE_MOTION_GOTO = 'motion_goto'
export const OPCODE_MOTION_GOTOXY = 'motion_gotoxy'
export const OPCODE_MOTION_GLIDETO = 'motion_glideto'
export const OPCODE_MOTION_GLIDESECSTOXY = 'motion_glidesecstoxy'
export const OPCODE_MOTION_POINTINDIRECTION = 'motion_pointindirection'
export const OPCODE_MOTION_POINTTOWARDS = 'motion_pointtowards'
export const OPCODE_MOTION_CHANGEXBY = 'motion_changexby'
export const OPCODE_MOTION_SETX = 'motion_setx'
export const OPCODE_MOTION_CHANGEYBY = 'motion_changeyby'
export const OPCODE_MOTION_SETY = 'motion_sety'
export const OPCODE_MOTION_IFONEDGEBOUNCE = 'motion_ifonedgebounce'
export const OPCODE_MOTION_SETROTATIONSTYLE = 'motion_setrotationstyle'
export const OPCODE_MOTION_XPOSITION = 'motion_xposition'
export const OPCODE_MOTION_YPOSITION = 'motion_yposition'
export const OPCODE_MOTION_DIRECTION = 'motion_direction'
export const OPCODE_LOOKS_SAYFORSECS = 'looks_sayforsecs'
export const OPCODE_LOOKS_SAY = 'looks_say'
export const OPCODE_LOOKS_THINKFORSECS = 'looks_thinkforsecs'
export const OPCODE_LOOKS_THINK = 'looks_think'
export const OPCODE_LOOKS_SWITCHCOSTUMETO = 'looks_switchcostumeto'
export const OPCODE_LOOKS_NEXTCOSTUME = 'looks_nextcostume'
export const OPCODE_LOOKS_SWITCHBACKDROPTO = 'looks_switchbackdropto'
export const OPCODE_LOOKS_SWITCHBACKDROPTOANDWAIT =
    'looks_switchbackdroptoandwait'
export const OPCODE_LOOKS_NEXTBACKDROP = 'looks_nextbackdrop'
export const OPCODE_LOOKS_CHANGESIZEBY = 'looks_changesizeby'
export const OPCODE_LOOKS_SETSIZETO = 'looks_setsizeto'
export const OPCODE_LOOKS_CHANGEEFFECTBY = 'looks_changeeffectby'
export const OPCODE_LOOKS_SETEFFECTTO = 'looks_seteffectto'
export const OPCODE_LOOKS_CLEARGRAPHICEFFECTS = 'looks_cleargraphiceffects'
export const OPCODE_LOOKS_SHOW = 'looks_show'
export const OPCODE_LOOKS_HIDE = 'looks_hide'
export const OPCODE_LOOKS_GOTOFRONTBACK = 'looks_gotofrontback'
export const OPCODE_LOOKS_GOFORWARDBACKWARDLAYERS =
    'looks_goforwardbackwardlayers'
export const OPCODE_LOOKS_COSTUMENUMBERNAME = 'looks_costumenumbername'
export const OPCODE_LOOKS_BACKDROPNUMBERNAME = 'looks_backdropnumbername'
export const OPCODE_LOOKS_SIZE = 'looks_size'
export const OPCODE_SOUND_PLAYUNTILDONE = 'sound_playuntildone'
export const OPCODE_SOUND_PLAY = 'sound_play'
export const OPCODE_SOUND_STOPALLSOUNDS = 'sound_stopallsounds'
export const OPCODE_SOUND_CHANGEEFFECTBY = 'sound_changeeffectby'
export const OPCODE_SOUND_SETEFFECTTO = 'sound_seteffectto'
export const OPCODE_SOUND_CLEAREFFECTS = 'sound_cleareffects'
export const OPCODE_SOUND_CHANGEVOLUMEBY = 'sound_changevolumeby'
export const OPCODE_SOUND_SETVOLUMETO = 'sound_setvolumeto'
export const OPCODE_SOUND_VOLUME = 'sound_volume'
export const OPCODE_EVENT_WHENFLAGCLICKED = 'event_whenflagclicked'
export const OPCODE_EVENT_WHENKEYPRESSED = 'event_whenkeypressed'
export const OPCODE_EVENT_WHENTHISSPRITECLICKED = 'event_whenthisspriteclicked'
export const OPCODE_EVENT_WHENSTAGECLICKED = 'event_whenstageclicked'
export const OPCODE_EVENT_WHENBACKDROPSWITCHESTO =
    'event_whenbackdropswitchesto'
export const OPCODE_EVENT_WHENGREATERTHAN = 'event_whengreaterthan'
export const OPCODE_EVENT_WHENBROADCASTRECEIVED = 'event_whenbroadcastreceived'
export const OPCODE_EVENT_BROADCAST = 'event_broadcast'
export const OPCODE_EVENT_BROADCASTANDWAIT = 'event_broadcastandwait'
export const OPCODE_CONTROL_WAIT = 'control_wait'
export const OPCODE_CONTROL_REPEAT = 'control_repeat'
export const OPCODE_CONTROL_FOREVER = 'control_forever'
export const OPCODE_CONTROL_IF = 'control_if'
export const OPCODE_CONTROL_IF_ELSE = 'control_if_else'
export const OPCODE_CONTROL_WAIT_UNTIL = 'control_wait_until'
export const OPCODE_CONTROL_REPEAT_UNTIL = 'control_repeat_until'
export const OPCODE_CONTROL_STOP = 'control_stop'
export const OPCODE_CONTROL_START_AS_CLONE = 'control_start_as_clone'
export const OPCODE_CONTROL_CREATE_CLONE_OF = 'control_create_clone_of'
export const OPCODE_CONTROL_DELETE_THIS_CLONE = 'control_delete_this_clone'
export const OPCODE_SENSING_TOUCHINGOBJECT = 'sensing_touchingobject'
export const OPCODE_SENSING_TOUCHINGCOLOR = 'sensing_touchingcolor'
export const OPCODE_SENSING_COLORISTOUCHINGCOLOR =
    'sensing_coloristouchingcolor'
export const OPCODE_SENSING_DISTANCETO = 'sensing_distanceto'
export const OPCODE_SENSING_ASKANDWAIT = 'sensing_askandwait'
export const OPCODE_SENSING_ANSWER = 'sensing_answer'
export const OPCODE_SENSING_KEYPRESSED = 'sensing_keypressed'
export const OPCODE_SENSING_MOUSEDOWN = 'sensing_mousedown'
export const OPCODE_SENSING_MOUSEX = 'sensing_mousex'
export const OPCODE_SENSING_MOUSEY = 'sensing_mousey'
export const OPCODE_SENSING_SETDRAGMODE = 'sensing_setdragmode'
export const OPCODE_SENSING_LOUDNESS = 'sensing_loudness'
export const OPCODE_SENSING_TIMER = 'sensing_timer'
export const OPCODE_SENSING_RESETTIMER = 'sensing_resettimer'
export const OPCODE_SENSING_OF = 'sensing_of'
export const OPCODE_SENSING_CURRENT = 'sensing_current'
export const OPCODE_SENSING_DAYSSINCE2000 = 'sensing_dayssince2000'
export const OPCODE_SENSING_USERNAME = 'sensing_username'
export const OPCODE_OPERATOR_ADD = 'operator_add'
export const OPCODE_OPERATOR_SUBTRACT = 'operator_subtract'
export const OPCODE_OPERATOR_MULTIPLY = 'operator_multiply'
export const OPCODE_OPERATOR_DIVIDE = 'operator_divide'
export const OPCODE_OPERATOR_RANDOM = 'operator_random'
export const OPCODE_OPERATOR_GT = 'operator_gt'
export const OPCODE_OPERATOR_LT = 'operator_lt'
export const OPCODE_OPERATOR_EQUALS = 'operator_equals'
export const OPCODE_OPERATOR_AND = 'operator_and'
export const OPCODE_OPERATOR_OR = 'operator_or'
export const OPCODE_OPERATOR_NOT = 'operator_not'
export const OPCODE_OPERATOR_JOIN = 'operator_join'
export const OPCODE_OPERATOR_LETTER_OF = 'operator_letter_of'
export const OPCODE_OPERATOR_LENGTH = 'operator_length'
export const OPCODE_OPERATOR_CONTAINS = 'operator_contains'
export const OPCODE_OPERATOR_MOD = 'operator_mod'
export const OPCODE_OPERATOR_ROUND = 'operator_round'
export const OPCODE_OPERATOR_MATHOP = 'operator_mathop'
export const OPCODE_DATA_VARIABLE = 'data_variable'
export const OPCODE_DATA_SETVARIABLETO = 'data_setvariableto'
export const OPCODE_DATA_CHANGEVARIABLEBY = 'data_changevariableby'
export const OPCODE_DATA_SHOWVARIABLE = 'data_showvariable'
export const OPCODE_DATA_HIDEVARIABLE = 'data_hidevariable'
export const OPCODE_DATA_LISTCONTENTS = 'data_listcontents'
export const OPCODE_DATA_ADDTOLIST = 'data_addtolist'
export const OPCODE_DATA_DELETEOFLIST = 'data_deleteoflist'
export const OPCODE_DATA_DELETEALLOFLIST = 'data_deletealloflist'
export const OPCODE_DATA_INSERTATLIST = 'data_insertatlist'
export const OPCODE_DATA_REPLACEITEMOFLIST = 'data_replaceitemoflist'
export const OPCODE_DATA_ITEMOFLIST = 'data_itemoflist'
export const OPCODE_DATA_ITEMNUMOFLIST = 'data_itemnumoflist'
export const OPCODE_DATA_LENGTHOFLIST = 'data_lengthoflist'
export const OPCODE_DATA_LISTCONTAINSITEM = 'data_listcontainsitem'
export const OPCODE_DATA_SHOWLIST = 'data_showlist'
export const OPCODE_DATA_HIDELIST = 'data_hidelist'
export const OPCODE_PROCEDURES_DEFINITION = 'procedures_definition'
export const OPCODE_PROCEDURES_PROTOTYPE = 'procedures_prototype'
export const OPCODE_ARGUMENT_REPORTER_STRING_NUMBER =
    'argument_reporter_string_number'
export const OPCODE_ARGUMENT_REPORTER_BOOLEAN = 'argument_reporter_boolean'

export const OPCODE_MOTION_SCROLL_RIGHT = 'motion_scroll_right'
export const OPCODE_MOTION_SCROLL_UP = 'motion_scroll_up'
export const OPCODE_MOTION_ALIGN_SCENE = 'motion_align_scene'
export const OPCODE_MOTION_XSCROLL = 'motion_xscroll'
export const OPCODE_MOTION_YSCROLL = 'motion_yscroll'
export const OPCODE_LOOKS_HIDEALLSPRITES = 'looks_hideallsprites'
export const OPCODE_LOOKS_SETSTRETCHTO = 'looks_setstretchto'
export const OPCODE_LOOKS_CHANGESTRETCHBY = 'looks_changestretchby'
export const OPCODE_EVENT_WHENTOUCHINGOBJECT = 'event_whentouchingobject'
export const OPCODE_CONTROL_FOR_EACH = 'control_for_each'
export const OPCODE_CONTROL_WHILE = 'control_while'
export const OPCODE_CONTROL_GET_COUNTER = 'control_get_counter'
export const OPCODE_CONTROL_INCR_COUNTER = 'control_incr_counter'
export const OPCODE_CONTROL_CLEAR_COUNTER = 'control_clear_counter'
export const OPCODE_CONTROL_ALL_AT_ONCE = 'control_all_at_once'
export const OPCODE_SENSING_LOUD = 'sensing_loud'
export const OPCODE_SENSING_USERID = 'sensing_userid'
export const OPCODE_MOTION_GOTO_MENU = 'motion_goto_menu'
export const OPCODE_MOTION_GLIDETO_MENU = 'motion_glideto_menu'
export const OPCODE_MOTION_POINTTOWARDS_MENU = 'motion_pointtowards_menu'
export const OPCODE_LOOKS_COSTUME = 'looks_costume'
export const OPCODE_LOOKS_BACKDROPS = 'looks_backdrops'

export const OPCODE_SOUND_SOUNDS_MENU = 'sound_sounds_menu'
export const OPCODE_EVENT_BROADCAST_MENU = 'event_broadcast_menu'
export const OPCODE_CONTROL_CREATE_CLONE_OF_MENU =
    'control_create_clone_of_menu'
export const OPCODE_SENSING_TOUCHINGOBJECTMENU = 'sensing_touchingobjectmenu'
export const OPCODE_SENSING_DISTANCETOMENU = 'sensing_distancetomenu'
export const OPCODE_SENSING_KEYOPTIONS = 'sensing_keyoptions'
export const OPCODE_SENSING_OF_OBJECT_MENU = 'sensing_of_object_menu'
export const OPCODE_EVENT_TOUCHINGOBJECTMENU = 'event_touchingobjectmenu'

export const HIDDEN_OPCODES = [
    OPCODE_MOTION_SCROLL_RIGHT,
    OPCODE_MOTION_SCROLL_UP,
    OPCODE_MOTION_ALIGN_SCENE,
    OPCODE_MOTION_XSCROLL,
    OPCODE_MOTION_YSCROLL,
    OPCODE_LOOKS_HIDEALLSPRITES,
    OPCODE_LOOKS_SETSTRETCHTO,
    OPCODE_LOOKS_CHANGESTRETCHBY,
    OPCODE_EVENT_WHENTOUCHINGOBJECT,
    OPCODE_CONTROL_FOR_EACH,
    OPCODE_CONTROL_WHILE,
    OPCODE_CONTROL_GET_COUNTER,
    OPCODE_CONTROL_INCR_COUNTER,
    OPCODE_CONTROL_CLEAR_COUNTER,
    OPCODE_CONTROL_ALL_AT_ONCE,
    OPCODE_SENSING_LOUD,
    OPCODE_SENSING_USERID,
    OPCODE_MOTION_GOTO_MENU,
    OPCODE_MOTION_GLIDETO_MENU,
    OPCODE_MOTION_POINTTOWARDS_MENU,
    OPCODE_LOOKS_COSTUME,
    OPCODE_LOOKS_BACKDROPS,
]

export const MENUS = [
    OPCODE_SOUND_SOUNDS_MENU,
    OPCODE_EVENT_BROADCAST_MENU,
    OPCODE_CONTROL_CREATE_CLONE_OF_MENU,
    OPCODE_SENSING_TOUCHINGOBJECTMENU,
    OPCODE_SENSING_DISTANCETOMENU,
    OPCODE_SENSING_KEYOPTIONS,
    OPCODE_SENSING_OF_OBJECT_MENU,
    OPCODE_EVENT_TOUCHINGOBJECTMENU,
]
